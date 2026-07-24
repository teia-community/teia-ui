/**
 * Timezone helpers for calendar event timestamps.
 *
 * Storage model:
 *  - Timed events are stored as a UTC instant ending in `Z`
 *    (e.g. `2026-07-09T01:52:00Z`). The creator picks a LOCAL wall-clock time;
 *    we convert local -> UTC on save and UTC -> local on display / edit.
 *  - All-day events stay a bare floating date (`2026-07-09`) — an all-day event
 *    is the same calendar day in every timezone, never a single instant.
 *  - Legacy events predate this change and are stored as naive, zoneless
 *    strings (`2026-07-09T15:00`). They are treated as floating: the digits are
 *    shown as-is to every viewer (matching the historical behavior). They only
 *    become UTC instants if re-saved through the form.
 */

const ALL_DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const ZONED_RE = /T.*(Z|[+-]\d{2}:\d{2})$/

const pad = (n) => String(n).padStart(2, '0')

/** True for a bare `YYYY-MM-DD` (all-day / floating date). */
export function isAllDay(value) {
  return ALL_DAY_RE.test(String(value))
}

/** True for a string carrying an explicit zone (`Z` or `±HH:MM`). */
export function isZoned(value) {
  return ZONED_RE.test(String(value))
}

/**
 * Convert a `datetime-local` value (`YYYY-MM-DDTHH:mm`, local wall time) to a
 * UTC instant string (`YYYY-MM-DDTHH:mm:ssZ`). All-day dates and empty values
 * pass through unchanged — only timed values are anchored to an instant.
 * @param {string} value
 * @returns {string}
 */
export function toUTC(value) {
  const v = String(value ?? '')
  if (!v || isAllDay(v)) return v
  const date = new Date(v)
  if (Number.isNaN(date.getTime())) return v
  // Drop milliseconds: 2026-07-09T01:52:00.000Z -> 2026-07-09T01:52:00Z
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Convert a stored value to the local `YYYY-MM-DDTHH:mm` a `datetime-local`
 * input expects. Zoned instants become the viewer's local wall time; naive
 * (legacy) values already are local wall time, so their digits are kept;
 * all-day dates and empty values pass through unchanged.
 * @param {string} value
 * @returns {string}
 */
export function toLocalInput(value) {
  const v = String(value ?? '')
  if (!v || isAllDay(v)) return v
  if (isZoned(v)) {
    const date = new Date(v)
    if (Number.isNaN(date.getTime())) return v
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    )
  }
  // Naive / floating: already local wall time; keep the datetime-local slice.
  return v.slice(0, 16)
}

/**
 * The event's calendar day (`YYYY-MM-DD`) in the VIEWER's local timezone.
 * Zoned instants are converted first (so an event near midnight lands in the
 * right day cell); floating / all-day values use their literal date digits.
 * @param {string} value
 * @returns {string}
 */
export function localDayKey(value) {
  const v = String(value ?? '')
  if (isZoned(v)) {
    const date = new Date(v)
    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )}`
    }
  }
  return v.slice(0, 10)
}

/**
 * A sortable instant (ms since epoch) for an event start. Zoned / naive strings
 * parse via Date (naive as local); all-day dates parse as local midnight so
 * they order alongside timed events on the same day. NaN for unparseable input.
 * @param {string} value
 * @returns {number}
 */
export function toInstant(value) {
  const v = String(value ?? '')
  if (!v) return NaN
  return new Date(isAllDay(v) ? `${v}T00:00:00` : v).getTime()
}
