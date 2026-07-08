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
 * @property {string} [url]
 * @property {string} [dtstamp]
 */

const ALL_DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const ZONED_RE = /T.*(Z|[+-]\d{2}:\d{2})$/

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

function buildEvent(event, feedDtstamp) {
  const {
    uid,
    sequence,
    title,
    start,
    end,
    description,
    location,
    url,
    dtstamp,
  } = event

  const isAllDay = ALL_DAY_RE.test(start)
  const lines = ['BEGIN:VEVENT', `UID:${uid}`, `SEQUENCE:${sequence}`]

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

  lines.push(`SUMMARY:${escapeText(title)}`)

  if (description) {
    lines.push(`DESCRIPTION:${escapeText(description)}`)
  }
  if (location) {
    lines.push(`LOCATION:${escapeText(location)}`)
  }
  if (url) {
    lines.push(`URL:${url}`)
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
    `X-WR-CALNAME:${calName || 'Teia Community Calendar'}`,
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ]

  for (const event of events || []) {
    lines.push(...buildEvent(event, dtstamp))
  }

  lines.push('END:VCALENDAR')

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
