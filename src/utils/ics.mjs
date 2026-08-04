/**
 * Pure, deterministic RFC-5545 (iCalendar) serializer.
 *
 * Zero imports, zero @/ aliases, zero import.meta/Date.now — every timestamp
 * used by callers is passed in explicitly so this module is safe to import
 * from both the browser bundle and a Netlify Function.
 */

/**
 * @typedef {Object} IcsEvent
 * @property {string}  uid
 * @property {number}  sequence
 * @property {string}  title
 * @property {string}  start        // ISO string (date-only, zoned, or naive)
 * @property {string} [end]
 * @property {string} [description]
 * @property {string} [location]
 * @property {string[]} [categories]
 * @property {string} [url]
 * @property {string} [dtstamp]
 * @property {{ freq: string, interval?: number, until?: string, count?: number }} [recurrence]
 */

const ALL_DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const ZONED_RE = /T.*(Z|[+-]\d{2}:\d{2})$/
const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}/
const VALID_FREQS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

/**
 * Strip CR/LF (and other C0 controls) so an untrusted value can never inject
 * extra content lines. escapeText covers the text fields; this is the backstop
 * for values that must stay unescaped (UID, URL, RRULE parts).
 * @param {string} value
 * @returns {string}
 */
function stripBreaks(value) {
  // eslint-disable-next-line no-control-regex
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '')
}

/**
 * Event URLs come from community-controlled IPFS JSON: only allow http(s)/
 * mailto, with line breaks stripped. Returns '' (drop the line) otherwise.
 * @param {string} url
 * @returns {string}
 */
function sanitizeUrl(url) {
  const clean = stripBreaks(url).trim()
  return /^(https?:|mailto:)/i.test(clean) ? clean : ''
}

/**
 * Escape SUMMARY/DESCRIPTION/LOCATION text per RFC 5545 (section 3.3.11).
 * Order matters: backslash first, then semicolon/comma, then newlines.
 * NEVER apply to UID/URL/DT* values.
 * @param {string} value
 * @returns {string}
 */
export function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Fold a content line at 75 octets (UTF-8 bytes, not characters), per
 * RFC 5545 section 3.1. Continuation lines are prefixed with a single
 * leading space. Never split a multi-byte code point across the boundary.
 * @param {string} line
 * @returns {string}
 */
export function foldLine(line) {
  const chars = Array.from(line)
  let out = ''
  let byteLen = 0
  let first = true

  for (const ch of chars) {
    const chByteLen = new TextEncoder().encode(ch).length
    const limit = first ? 75 : 74 // continuation lines lose 1 octet to the leading space
    if (byteLen + chByteLen > limit) {
      out += '\r\n '
      byteLen = 0
      first = false
    }
    out += ch
    byteLen += chByteLen
  }

  return out
}

function pad(n, len = 2) {
  return String(n).padStart(len, '0')
}

/**
 * Format an all-day (date-only) ISO string as YYYYMMDD.
 * @param {string} iso
 * @returns {string}
 */
function formatDateOnly(iso) {
  return iso.replace(/-/g, '')
}

/**
 * Add one calendar day to a YYYY-MM-DD string, handling month/year rollover.
 * @param {string} iso
 * @returns {string} YYYY-MM-DD
 */
function addOneDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + 1)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`
}

/**
 * Format DTSTART/DTEND value (without the property name) for a timed
 * (non-all-day) ISO string. Zoned strings (Z or +HH:MM offset) are
 * converted to UTC basic format ending in Z. Naive/floating strings are
 * sliced directly (no Date() parsing) so the runtime's UTC clock can't
 * shift them.
 * @param {string} iso
 * @returns {string}
 */
export function formatDtStart(iso) {
  if (ALL_DAY_RE.test(iso)) {
    return formatDateOnly(iso)
  }

  if (ZONED_RE.test(iso)) {
    const date = new Date(iso)
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
        date.getUTCDate()
      )}T` +
      `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
        date.getUTCSeconds()
      )}Z`
    )
  }

  // Naive/floating local time: slice components directly, no Z, no TZID.
  const match = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  )
  if (match) {
    const [, y, mo, d, h, mi, s] = match
    return `${y}${mo}${d}T${h}${mi}${s || '00'}`
  }

  // Fallback: treat as all-day.
  return formatDateOnly(iso.slice(0, 10))
}

/**
 * Format a Date-like UTC timestamp as basic UTC form, always ending in Z.
 * @param {string} iso
 * @returns {string}
 */
function formatDtStamp(iso) {
  const date = new Date(iso)
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
      date.getUTCDate()
    )}T` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
      date.getUTCSeconds()
    )}Z`
  )
}

/**
 * Format an RRULE UNTIL value. Per RFC 5545 3.3.10 it must share the DTSTART
 * value type: a DATE for all-day, a floating DATE-TIME for naive starts, and a
 * UTC DATE-TIME for zoned starts. `until` is a YYYY-MM-DD date; we anchor it to
 * end-of-day so the last instance on that date is included.
 * @param {string} until
 * @param {string} start
 * @returns {string}
 */
function formatUntil(until, start) {
  const day = String(until).slice(0, 10).replace(/-/g, '')
  if (ALL_DAY_RE.test(start)) return day
  if (ZONED_RE.test(start)) return `${day}T235959Z`
  return `${day}T235959`
}

/**
 * Build an RRULE value (without the property name) from a simple recurrence.
 * @param {{ freq: string, interval?: number, until?: string, count?: number }} recurrence
 * @param {string} start
 * @returns {string}
 */
function buildRRule(recurrence, start) {
  const parts = [`FREQ=${recurrence.freq}`]
  const interval = Math.max(1, Number(recurrence.interval) || 1)
  if (interval > 1) parts.push(`INTERVAL=${interval}`)
  if (recurrence.count) {
    parts.push(`COUNT=${Math.max(1, Number(recurrence.count))}`)
  } else if (recurrence.until) {
    parts.push(`UNTIL=${formatUntil(recurrence.until, start)}`)
  }
  return parts.join(';')
}

function buildEvent(event, feedDtstamp) {
  const {
    uid,
    sequence,
    title,
    start,
    end,
    description,
    location,
    categories,
    url,
    dtstamp,
    recurrence,
  } = event

  // A start that isn't date-shaped (missing/garbage IPFS data) would crash the
  // formatters below — skip the event rather than break the whole calendar.
  if (!DATE_PREFIX_RE.test(String(start ?? ''))) return []

  const isAllDay = ALL_DAY_RE.test(start)
  const lines = [
    'BEGIN:VEVENT',
    `UID:${stripBreaks(uid)}`,
    `SEQUENCE:${Number(sequence) || 0}`,
  ]

  lines.push(`DTSTAMP:${formatDtStamp(dtstamp || feedDtstamp)}`)

  if (isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(start)}`)
    const endDate = end && ALL_DAY_RE.test(end) ? addOneDay(end) : addOneDay(start)
    lines.push(`DTEND;VALUE=DATE:${formatDateOnly(endDate)}`)
  } else {
    lines.push(`DTSTART:${formatDtStart(start)}`)
    if (end) {
      lines.push(`DTEND:${formatDtStart(end)}`)
    }
  }

  // Recurrence comes from untrusted JSON: only emit an RRULE when freq is one
  // of the four supported values and any until is date-shaped (no injection).
  if (
    recurrence &&
    VALID_FREQS.includes(recurrence.freq) &&
    (!recurrence.until || DATE_PREFIX_RE.test(String(recurrence.until)))
  ) {
    lines.push(`RRULE:${buildRRule(recurrence, start)}`)
  }

  lines.push(`SUMMARY:${escapeText(title)}`)

  if (description) {
    lines.push(`DESCRIPTION:${escapeText(description)}`)
  }
  if (location) {
    lines.push(`LOCATION:${escapeText(location)}`)
  }
  if (Array.isArray(categories) && categories.length > 0) {
    lines.push(`CATEGORIES:${categories.map(escapeText).join(',')}`)
  }
  const safeUrl = sanitizeUrl(url)
  if (safeUrl) {
    lines.push(`URL:${safeUrl}`)
  }

  lines.push('END:VEVENT')

  return lines
}

/**
 * @param {{ events: IcsEvent[], dtstamp: string, calName?: string, prodId?: string }} args
 * @returns {string} complete VCALENDAR, CRLF-terminated
 */
export function buildICS({ events, dtstamp, calName, prodId }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId || '-//Teia//Community Calendar//EN'}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName || 'Teia Community Calendar')}`,
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ]

  for (const event of events || []) {
    lines.push(...buildEvent(event, dtstamp))
  }

  lines.push('END:VCALENDAR')

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
