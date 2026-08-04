-- calendar_feed.lua — serves the whole-calendar .ics subscribe feed in-container.
--
-- Faithful port of src/utils/ics.mjs (RFC-5545 serializer) + the fetch logic of
-- functions/calendar-feed.mjs, using OpenResty's ngx.location.capture pattern
-- (same as docker/lua/previews.lua). No resty.http (not bundled in the alpine
-- image). Content-Type / Content-Disposition / Cache-Control are set by the
-- nginx location; this script only prints the body.
--
-- Assumes the following nginx wiring (added by a teammate):
--   * internal `location ^~ /tzkt/`  → proxy_pass https://api.tzkt.io/
--   * existing `location /ipfs/`      → gateway, driven by `vars = { cid = ... }`
--   * `lua_shared_dict calendar_feed 1m`
--   * this file mounted as the content handler for the /calendar.ics location,
--     with `default_type "text/calendar; charset=utf-8"` + Content-Disposition.

local cjson = require "cjson.safe"

-- Mainnet teiaCalendar contract, mirrored from CALENDAR_CONTRACT in
-- src/constants.ts and functions/calendar-feed.mjs.
local CONTRACT = "KT1FxyjsMjNiske7KZQhRtcbTwWJQpv8bmLw"

-- ---------------------------------------------------------------------------
-- Serve from cache if present.
-- ---------------------------------------------------------------------------
local store = ngx.shared.calendar_feed
if store then
    local cached = store:get("ics")
    if cached then
        ngx.print(cached)
        return
    end
end

-- ---------------------------------------------------------------------------
-- Proleptic Gregorian calendar math (Howard Hinnant's algorithms). Reused for
-- addOneDay (all-day exclusive DTEND) and for shifting zoned offsets to UTC.
-- Correct across month/year boundaries and leap years; all our years > 0.
-- ---------------------------------------------------------------------------
local function days_from_civil(y, m, d)
    y = (m <= 2) and (y - 1) or y
    local era = math.floor((y >= 0 and y or (y - 399)) / 400)
    local yoe = y - era * 400
    local doy = math.floor((153 * ((m > 2) and (m - 3) or (m + 9)) + 2) / 5) + d - 1
    local doe = yoe * 365 + math.floor(yoe / 4) - math.floor(yoe / 100) + doy
    return era * 146097 + doe - 719468
end

local function civil_from_days(z)
    z = z + 719468
    local era = math.floor((z >= 0 and z or (z - 146096)) / 146097)
    local doe = z - era * 146097
    local yoe = math.floor((doe - math.floor(doe / 1460) + math.floor(doe / 36524) - math.floor(doe / 146096)) / 365)
    local y = yoe + era * 400
    local doy = doe - (365 * yoe + math.floor(yoe / 4) - math.floor(yoe / 100))
    local mp = math.floor((5 * doy + 2) / 153)
    local d = doy - math.floor((153 * mp + 2) / 5) + 1
    local m = (mp < 10) and (mp + 3) or (mp - 9)
    y = (m <= 2) and (y + 1) or y
    return y, m, d
end

-- Add one calendar day to a YYYY-MM-DD string, returning basic YYYYMMDD form
-- (matches ics.mjs addOneDay → formatDateOnly). Exclusive end for all-day.
local function addOneDay(iso)
    local y, m, d = iso:match("^(%d%d%d%d)-(%d%d)-(%d%d)")
    local yy, mm, dd = civil_from_days(days_from_civil(tonumber(y), tonumber(m), tonumber(d)) + 1)
    return string.format("%04d%02d%02d", yy, mm, dd)
end

-- ---------------------------------------------------------------------------
-- Regex-shaped predicates (mirror ics.mjs ALL_DAY_RE / ZONED_RE / DATE_PREFIX_RE).
-- ---------------------------------------------------------------------------
local function is_all_day(iso)
    return iso:match("^%d%d%d%d%-%d%d%-%d%d$") ~= nil
end

local function is_zoned(iso)
    return iso:match("T.*Z$") ~= nil or iso:match("T.*[+-]%d%d:%d%d$") ~= nil
end

local function has_date_prefix(iso)
    return iso:match("^%d%d%d%d%-%d%d%-%d%d") ~= nil
end

-- ---------------------------------------------------------------------------
-- Text helpers (mirror ics.mjs stripBreaks / sanitizeUrl / escapeText).
-- ---------------------------------------------------------------------------

-- Remove C0 controls + DEL so an untrusted value can't inject content lines.
-- %c matches iscntrl (0x00-0x1f and 0x7f), same set as ics.mjs stripBreaks.
local function strip_breaks(v)
    return (tostring(v or ""):gsub("%c", ""))
end

-- Only allow http(s)/mailto URLs, breaks stripped + trimmed; '' drops the line.
local function sanitize_url(url)
    local clean = strip_breaks(url):match("^%s*(.-)%s*$")
    local lower = clean:lower()
    if lower:match("^https?:") or lower:match("^mailto:") then
        return clean
    end
    return ""
end

-- Escape SUMMARY/DESCRIPTION/LOCATION/CATEGORIES text per RFC 5545 3.3.11.
-- Order matters: backslash first, then ; , then , then CR?LF -> \n.
local function escape_text(v)
    v = tostring(v == nil and "" or v)
    v = v:gsub("\\", "\\\\")
    v = v:gsub(";", "\\;")
    v = v:gsub(",", "\\,")
    v = v:gsub("\r\n", "\\n") -- CRLF first...
    v = v:gsub("\n", "\\n")   -- ...then lone LF; a lone CR is left as-is (matches /\r?\n/)
    return v
end

-- ---------------------------------------------------------------------------
-- DT value formatting (mirror ics.mjs formatDtStart / formatUntil).
-- ---------------------------------------------------------------------------

-- Zoned ISO -> UTC basic form YYYYMMDDTHHMMSSZ. Z strings stay put; +HH:MM /
-- -HH:MM offsets are actually shifted to UTC (UTC = wall-time - offset).
local function format_zoned(iso)
    local y, mo, d, h, mi = iso:match("^(%d%d%d%d)-(%d%d)-(%d%d)T(%d%d):(%d%d)")
    local s = iso:match("^%d%d%d%d%-%d%d%-%d%dT%d%d:%d%d:(%d%d)") or "00"
    y, mo, d, h, mi, s = tonumber(y), tonumber(mo), tonumber(d), tonumber(h), tonumber(mi), tonumber(s)

    local offset = 0
    if not iso:match("Z$") then
        local sign, oh, om = iso:match("([+-])(%d%d):(%d%d)$")
        if sign then
            offset = tonumber(oh) * 3600 + tonumber(om) * 60
            if sign == "+" then offset = -offset end
        end
    end

    local total = days_from_civil(y, mo, d) * 86400 + h * 3600 + mi * 60 + s + offset
    local day = math.floor(total / 86400)
    local rem = total - day * 86400
    local hh = math.floor(rem / 3600)
    local mm = math.floor((rem - hh * 3600) / 60)
    local ss = rem - hh * 3600 - mm * 60
    local yy, MM, dd = civil_from_days(day)
    return string.format("%04d%02d%02dT%02d%02d%02dZ", yy, MM, dd, hh, mm, ss)
end

local function format_dt_start(iso)
    if is_all_day(iso) then
        return (iso:gsub("%-", ""))
    end
    if is_zoned(iso) then
        return format_zoned(iso)
    end
    -- Naive/floating: slice components directly, no Z, no TZID.
    local y, mo, d, h, mi = iso:match("^(%d%d%d%d)-(%d%d)-(%d%d)T(%d%d):(%d%d)")
    if y then
        local s = iso:match("^%d%d%d%d%-%d%d%-%d%dT%d%d:%d%d:(%d%d)") or "00"
        return y .. mo .. d .. "T" .. h .. mi .. s
    end
    -- Fallback: treat as all-day.
    return (iso:sub(1, 10):gsub("%-", ""))
end

-- Anchor RRULE UNTIL to end-of-day, matching DTSTART's value type.
local function format_until(until_val, start)
    local day = tostring(until_val):sub(1, 10):gsub("%-", "")
    if is_all_day(start) then return day end
    if is_zoned(start) then return day .. "T235959Z" end
    return day .. "T235959"
end

-- ---------------------------------------------------------------------------
-- Field / value helpers.
-- ---------------------------------------------------------------------------
local NULL = cjson.null

-- JS-ish truthiness: nil/false/0/'' and cjson null are falsy.
local function truthy(v)
    return v ~= nil and v ~= false and v ~= NULL and v ~= 0 and v ~= ""
end

-- Return a non-empty string value, else nil (mirrors JS `x || undefined`).
local function str_field(v)
    if type(v) == "string" and v ~= "" then return v end
    return nil
end

local VALID_FREQS = { DAILY = true, WEEKLY = true, MONTHLY = true, YEARLY = true }

-- Build an RRULE value (mirror ics.mjs buildRRule). `until` is a reserved word
-- in Lua, so recurrence's until field is read via bracket access throughout.
local function build_rrule(rec, start)
    local parts = { "FREQ=" .. rec.freq }
    local interval = math.max(1, tonumber(rec.interval) or 1)
    if interval > 1 then parts[#parts + 1] = "INTERVAL=" .. interval end
    if truthy(rec.count) then
        parts[#parts + 1] = "COUNT=" .. math.max(1, tonumber(rec.count) or 1)
    elseif truthy(rec["until"]) then
        parts[#parts + 1] = "UNTIL=" .. format_until(rec["until"], start)
    end
    return table.concat(parts, ";")
end

-- ---------------------------------------------------------------------------
-- Line folding at 75 octets (mirror ics.mjs foldLine). Continuation lines are
-- prefixed with a single space (74-octet limit) and never split a UTF-8 seq.
-- ---------------------------------------------------------------------------
local function fold_line(line)
    local out = {}
    local byte_len = 0
    local first = true
    local i, n = 1, #line
    while i <= n do
        local b = string.byte(line, i)
        local clen
        if b < 0x80 then clen = 1
        elseif b < 0xE0 then clen = 2
        elseif b < 0xF0 then clen = 3
        else clen = 4 end
        local limit = first and 75 or 74
        if byte_len + clen > limit then
            out[#out + 1] = "\r\n "
            byte_len = 0
            first = false
        end
        out[#out + 1] = string.sub(line, i, i + clen - 1)
        byte_len = byte_len + clen
        i = i + clen
    end
    return table.concat(out)
end

-- ---------------------------------------------------------------------------
-- Fetch: TzKT active event keys, then each event's IPFS document.
-- ---------------------------------------------------------------------------
local function is_hidden(value)
    return value.hidden == true or value.hidden == "true"
end

local keys = {}
do
    local res = ngx.location.capture(
        "/tzkt/v1/contracts/" .. CONTRACT ..
        "/bigmaps/events/keys?active=true&limit=10000&select=key,value"
    )
    if res and res.status == 200 then
        local decoded = cjson.decode(res.body)
        if type(decoded) == "table" then keys = decoded end
    end
    -- On any failure keys stays empty: the feed still renders, just eventless.
end

local dtstamp = os.date("!%Y%m%dT%H%M%SZ")

-- VCALENDAR header — exact ordering from ics.mjs buildICS.
local lines = {
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Teia//Community Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Teia Community Calendar",
    "X-PUBLISHED-TTL:PT1H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
}

for _, entry in ipairs(keys) do
    local value = entry.value
    if type(value) == "table" and not is_hidden(value) then
        local bare = (tostring(value.current_cid or ""):gsub("^ipfs://", ""))
        local res = ngx.location.capture("/ipfs/", { vars = { cid = bare } })
        if res and res.status == 200 then
            local doc = cjson.decode(res.body)
            local start = type(doc) == "table" and doc.startDate or nil
            -- One malformed document must only drop its own event, never the
            -- feed: skip unless startDate is date-prefixed (ics.mjs guard).
            if type(start) == "string" and has_date_prefix(start) then
                local end_val = str_field(doc.endDate)

                lines[#lines + 1] = "BEGIN:VEVENT"
                lines[#lines + 1] = "UID:" .. strip_breaks("chain-" .. tostring(entry.key) .. "@teia.art")
                lines[#lines + 1] = "SEQUENCE:" .. (tonumber(value.version_count) or 0)
                lines[#lines + 1] = "DTSTAMP:" .. dtstamp

                if is_all_day(start) then
                    lines[#lines + 1] = "DTSTART;VALUE=DATE:" .. (start:gsub("%-", ""))
                    local end_date
                    if end_val and is_all_day(end_val) then
                        end_date = addOneDay(end_val)
                    else
                        end_date = addOneDay(start)
                    end
                    lines[#lines + 1] = "DTEND;VALUE=DATE:" .. end_date
                else
                    lines[#lines + 1] = "DTSTART:" .. format_dt_start(start)
                    if end_val then
                        lines[#lines + 1] = "DTEND:" .. format_dt_start(end_val)
                    end
                end

                -- RRULE (before SUMMARY, per ics.mjs buildEvent): only for a
                -- supported freq and a date-shaped (or absent) until.
                local rec = doc.recurrence
                if type(rec) == "table" and VALID_FREQS[rec.freq]
                    and (not truthy(rec["until"]) or has_date_prefix(tostring(rec["until"]))) then
                    lines[#lines + 1] = "RRULE:" .. build_rrule(rec, start)
                end

                lines[#lines + 1] = "SUMMARY:" .. escape_text(doc.title)

                local description = str_field(doc.description)
                if description then
                    lines[#lines + 1] = "DESCRIPTION:" .. escape_text(description)
                end
                local location = str_field(doc.location)
                if location then
                    lines[#lines + 1] = "LOCATION:" .. escape_text(location)
                end

                local tags = doc.tags
                if type(tags) == "table" and #tags > 0 then
                    local cats = {}
                    for _, t in ipairs(tags) do cats[#cats + 1] = escape_text(t) end
                    lines[#lines + 1] = "CATEGORIES:" .. table.concat(cats, ",")
                end

                local links = doc.links
                local url = type(links) == "table" and type(links[1]) == "table" and links[1].url or nil
                local safe_url = sanitize_url(url)
                if safe_url ~= "" then
                    lines[#lines + 1] = "URL:" .. safe_url
                end

                lines[#lines + 1] = "END:VEVENT"
            end
        end
    end
end

lines[#lines + 1] = "END:VCALENDAR"

-- Fold each line, join with CRLF, terminate with a trailing CRLF (ics.mjs).
local folded = {}
for i = 1, #lines do folded[i] = fold_line(lines[i]) end
local body = table.concat(folded, "\r\n") .. "\r\n"

if store then
    store:set("ics", body, 1800)
end

ngx.print(body)
return
