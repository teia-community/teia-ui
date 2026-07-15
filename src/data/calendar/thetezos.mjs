/**
 * thetezos.com Modern Events Calendar (MEC) source — server-side only.
 *
 * The MEC REST API (`/wp-json/mec/v1.0/events`) requires a secret `mec-token`
 * header that browsers can't send (it isn't in the endpoint's CORS
 * `Access-Control-Allow-Headers`) and that must never ship in the client
 * bundle. So this module runs only server-side: the Netlify function
 * (`functions/thetezos-events.mjs`) in production, and the Vite dev middleware
 * (see vite.config.js) locally. Both hold the token in `MEC_TOKEN` env and
 * expose the normalized result at `/api/thetezos-events`.
 *
 * Unlike the old `wp/v2/mec-events` endpoint, this one exposes the REAL event
 * start/end date+time per occurrence (recurring events are pre-expanded), so
 * events land on the day they actually happen instead of their post date.
 *
 * Two scopes are used (see {@link fetchThetezosEvents}):
 *  - upcoming (`include_past_events=1`): current + future, and any ongoing
 *    multi-day event spanning today (which a pure future query would miss);
 *  - past (`show_only_past_events=1`): past occurrences, newest first, with
 *    `limit` controlling how far back it reaches.
 */

const MEC_API = 'https://thetezos.com/wp-json/mec/v1.0/events'

/** Decode the HTML entities WordPress content commonly carries. */
function decodeEntities(input) {
  return String(input)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
}

/** Strip tags + decode entities to readable text, preserving paragraph and
 *  line breaks (block boundaries → blank line, <br> → newline) so the calendar
 *  card can render it as paragraphs instead of one collapsed blob. 
 * to be adjusted with TTC API Update */
function stripHtml(html) {
  const withBreaks = String(html || '')
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|blockquote|tr)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
  return decodeEntities(withBreaks)
    .replace(/[^\S\n]+/g, ' ') // collapse spaces/tabs, keep newlines
    .replace(/ *\n */g, '\n') // trim spaces around newlines
    .replace(/\n{3,}/g, '\n\n') // cap blank runs at one blank line
    .trim()
}

/** MEC time part { hour, minutes, ampm } → "HH:mm" (24h). */
function toTime(part) {
  if (!part) return '00:00'
  let h = parseInt(part.hour, 10)
  if (Number.isNaN(h)) h = 0
  const m = String(part.minutes ?? '0').padStart(2, '0')
  const ap = String(part.ampm || '').toLowerCase()
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m}`
}

/**
 * Map one occurrence (`{ ID, data, date }`) to our CalendarEvent shape.
 * Returns null for entries without a usable start date.
 */
function mapOccurrence(item) {
  const data = item?.data
  if (!data) return null
  // Per-occurrence dates are authoritative (recurring events reuse the series'
  // meta start/end, which would be wrong for later instances).
  const start = item.date?.start
  const end = item.date?.end
  const startDay = start?.date || data.meta?.mec_start_date
  if (!startDay) return null
  const endDay = end?.date || data.meta?.mec_end_date || ''

  const startDate = `${startDay}T${toTime(start)}`
  const endDate = endDay ? `${endDay}T${toTime(end)}` : ''

  const postId = data.post?.ID ?? data.ID
  const locations = Object.values(data.locations || {})
  const location = locations.length
    ? [locations[0].name, locations[0].address].filter(Boolean).join(', ')
    : ''
  const img = data.featured_image || {}
  const image = img.full || img.large || img.medium || img.tileview || ''
  const tags = Object.values(data.categories || {})
    .map((c) => c?.name)
    .filter(Boolean)

  return {
    // Unique per occurrence; `postId` is kept for de-duping against the old feed.
    id: `wp-${postId}-${startDay}`,
    postId,
    title: stripHtml(data.title || data.post?.post_title || ''),
    description: stripHtml(data.post?.post_content || data.content || ''),
    startDate,
    endDate,
    location,
    links: data.permalink
      ? [{ label: 'thetezos.com', url: data.permalink }]
      : [],
    images: image ? [image] : [],
    tags,
    createdBy: '',
    createdAt: '',
    updatedAt: '',
    source: 'wp',
    readOnly: true,
  }
}

/**
 * Fetch events from the MEC API and normalize them.
 * @param {string} token  the `mec-token` value
 * @param {{ limit?: number, past?: boolean }} [opts]
 *   `limit` — max occurrences (recurring events expand; for `past`, this also
 *   controls how far back the newest-first list reaches).
 *   `past` — true to fetch past occurrences instead of upcoming/ongoing.
 * @returns {Promise<object[]>}
 */
export async function fetchThetezosEvents(token, { limit = 100, past = false } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  // Past: only past occurrences (newest first). Upcoming: current + future,
  // including ongoing events that started before today.
  params.set(past ? 'show_only_past_events' : 'include_past_events', '1')
  const res = await fetch(`${MEC_API}?${params}`, {
    headers: { 'mec-token': token },
  })
  if (!res.ok) throw new Error(`MEC ${res.status} ${res.statusText}`)
  const payload = await res.json()
  // Response shape: { events: { 'YYYY-MM-DD': [ { ID, data, date }, ... ] } }.
  const groups = payload?.events && typeof payload.events === 'object'
    ? Object.values(payload.events)
    : []
  const out = []
  for (const items of groups) {
    for (const item of items || []) {
      const mapped = mapOccurrence(item)
      if (mapped) out.push(mapped)
    }
  }
  return out
}
