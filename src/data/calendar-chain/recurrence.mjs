/**
 * Simple recurrence expansion + labels for on-chain calendar events.
 *
 * Pure/deterministic — the display window is passed in (no `new Date()` here)
 * so it's testable and reusable. A Recurrence is
 * `{ freq: 'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY', interval, until?, count? }`;
 * `until` is a YYYY-MM-DD date, `count` a total number of occurrences.
 *
 * The `.ics` feed does NOT use this — it emits a single RRULE and lets calendar
 * apps expand. This is only for rendering occurrences inside the app, so it
 * mirrors RFC 5545 semantics: each occurrence is computed from the series
 * anchor (never cumulatively, which would drift), and instances that land on
 * an invalid date (e.g. Jan 31 monthly → February) are skipped, not rolled.
 */

import { isZoned } from '../../utils/datetime.mjs'

const pad = (n) => String(n).padStart(2, '0')

const FREQS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

/** Parse a 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm' string as a LOCAL Date. */
function parseLocal(str) {
  const [d, t] = String(str).split('T')
  const [y, mo, da] = d.split('-').map(Number)
  const [h = 0, mi = 0] = (t || '').split(':').map(Number)
  return new Date(y, (mo || 1) - 1, da || 1, h, mi)
}

/** Parse an anchor: zoned strings as the instant they name, naive as LOCAL. */
function parseAnchor(str) {
  return isZoned(str) ? new Date(str) : parseLocal(str)
}

/** Format a Date back to the shape of `template` (date-only, datetime-local, or UTC instant). */
function formatLike(date, template) {
  if (isZoned(template)) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }
  const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`
  if (!String(template).includes('T')) return dateStr
  return `${dateStr}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * The k-th occurrence (0-based) of a series, computed from the anchor start.
 * Returns null for instances that fall on an invalid date — a monthly series
 * on the 31st skips 30-day months, a Feb-29 yearly series skips non-leap
 * years — matching how calendar apps expand the equivalent RRULE.
 *
 * @param {string} startStr  the series anchor ('YYYY-MM-DD', 'YYYY-MM-DDTHH:mm')
 * @param {string} freq
 * @param {number} interval
 * @param {number} k
 * @returns {string|null}
 */
export function occurrenceAt(startStr, freq, interval, k) {
  const zoned = isZoned(startStr)
  const anchor = parseAnchor(startStr)
  const n = Math.max(1, Number(interval) || 1) * k
  if (freq === 'DAILY' || freq === 'WEEKLY') {
    const d = new Date(anchor)
    const days = freq === 'WEEKLY' ? 7 * n : n
    if (zoned) d.setUTCDate(d.getUTCDate() + days)
    else d.setDate(d.getDate() + days)
    return formatLike(d, startStr)
  }
  // MONTHLY/YEARLY: the anchor's day-of-month must exist in the target month.
  const months = freq === 'MONTHLY' ? n : 12 * n
  const day = zoned ? anchor.getUTCDate() : anchor.getDate()
  const target = zoned
    ? new Date(
        Date.UTC(
          anchor.getUTCFullYear(),
          anchor.getUTCMonth() + months,
          1,
          anchor.getUTCHours(),
          anchor.getUTCMinutes(),
          anchor.getUTCSeconds()
        )
      )
    : new Date(
        anchor.getFullYear(),
        anchor.getMonth() + months,
        1,
        anchor.getHours(),
        anchor.getMinutes()
      )
  const daysInMonth = zoned
    ? new Date(
        Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
      ).getUTCDate()
    : new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  if (day > daysInMonth) return null
  if (zoned) target.setUTCDate(day)
  else target.setDate(day)
  return formatLike(target, startStr)
}

const HARD_CAP = 5000

/**
 * Expand a recurring event into occurrences whose day falls within
 * [windowStart, windowEnd] (inclusive, 'YYYY-MM-DD'), respecting until/count.
 * Each occurrence preserves the event's start time and duration. Unknown
 * freq values (recurrence JSON is untrusted) expand to nothing.
 *
 * @param {string} startDate
 * @param {string} endDate
 * @param {{ freq: string, interval?: number, until?: string, count?: number }} recurrence
 * @param {{ windowStart: string, windowEnd: string, max?: number }} window
 * @returns {{ startDate: string, endDate: string }[]}
 */
export function expandOccurrences(
  startDate,
  endDate,
  recurrence,
  { windowStart, windowEnd, max = 366 }
) {
  if (!recurrence || !FREQS.includes(recurrence.freq) || !startDate) return []
  const durMs = endDate ? parseAnchor(endDate) - parseAnchor(startDate) : null
  const out = []
  let produced = 0 // valid instances so far — COUNT counts these, not skips

  for (let k = 0; k < HARD_CAP; k++) {
    if (recurrence.count && produced >= recurrence.count) break
    const cursor = occurrenceAt(
      startDate,
      recurrence.freq,
      recurrence.interval,
      k
    )
    if (cursor == null) continue // invalid date (RFC 5545: ignore, don't roll)
    if (recurrence.until && cursor.slice(0, 10) > recurrence.until.slice(0, 10)) {
      break
    }
    if (cursor.slice(0, 10) > windowEnd) break
    produced++
    if (cursor.slice(0, 10) >= windowStart) {
      const occEnd =
        durMs != null
          ? formatLike(new Date(parseAnchor(cursor).getTime() + durMs), endDate)
          : ''
      out.push({ startDate: cursor, endDate: occEnd })
      if (out.length >= max) break
    }
  }

  return out
}

const FREQ_UNIT = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' }

/** Human label, e.g. "Repeats every 2 weeks until 2026-12-31". */
export function recurrenceLabel(recurrence) {
  if (!recurrence || !recurrence.freq) return ''
  const n = Math.max(1, Number(recurrence.interval) || 1)
  const unit = FREQ_UNIT[recurrence.freq] || 'time'
  const every = n === 1 ? `every ${unit}` : `every ${n} ${unit}s`
  let end = ''
  if (recurrence.until) end = ` until ${recurrence.until.slice(0, 10)}`
  else if (recurrence.count) end = ` (${recurrence.count} times)`
  return `Repeats ${every}${end}`
}
