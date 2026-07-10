/**
 * WordPress read-only calendar source (thetezos.com).
 *
 * Two endpoints feed the calendar:
 *
 * 1. **Upcoming events — {@link fetchUpcomingEvents}.** The MEC API
 *    (`mec/v1.0/events`) exposes real per-occurrence start/end dates, so these
 *    land on the day they actually happen. It's token-gated and CORS-locked, so
 *    the browser hits our own `/api/thetezos-events` proxy (Netlify function in
 *    prod, Vite dev middleware locally) which adds the token server-side. This
 *    endpoint only returns future occurrences.
 *
 * 2. **Past events — {@link fetchPage}.** The old `wp/v2/mec-events` endpoint
 *    has no real event date (only the post publish `date`), so it is used
 *    solely to back-fill the "Previous Events" accordion. `title`/`excerpt`
 *    come back as HTML; we strip tags and decode entities. The featured image
 *    only resolves with `_embed=1` (`wp:featuredmedia[0].source_url`).
 *
 * All of these are READ-ONLY — merged in at read time, never written back.
 */

const API = 'https://thetezos.com/wp-json/wp/v2/mec-events'

/**
 * Upcoming events with REAL dates, via our server-side proxy (which holds the
 * MEC token). Returns already-normalized CalendarEvent-shaped objects.
 * @param {number} limit max occurrences to request
 * @returns {Promise<object[]>}
 */
export async function fetchUpcomingEvents(limit = 100) {
  const res = await fetch(`/api/thetezos-events?limit=${limit}`)
  if (!res.ok)
    throw new Error(`thetezos-events ${res.status} ${res.statusText}`)
  const { events } = await res.json()
  return Array.isArray(events) ? events : []
}

/** Default page size for both the first paint and the background sweep. */
export const PER_PAGE = 25

/** Strip HTML tags and decode entities to a single-line plain string. */
function toPlainText(html) {
  const noTags = String(html || '').replace(/<[^>]*>/g, ' ')
  // A detached <textarea> decodes entities (&#8211; &amp; …) without executing
  // anything — safe, and avoids shipping an entity table.
  const el = document.createElement('textarea')
  el.innerHTML = noTags
  return el.value.replace(/\s+/g, ' ').trim()
}

/**
 * Map one `mec-events` REST post to a CalendarEvent.
 * @param {any} post
 * @returns {import('./schema').CalendarEvent & { source: 'wp', readOnly: true }}
 */
function mapEvent(post) {
  const image = post?._embedded?.['wp:featuredmedia']?.[0]?.source_url
  return {
    // Namespaced so a WP id can never collide with a local UUID.
    id: `wp-${post.id}`,
    // Underlying WP post id, so the upcoming feed can de-dupe against these.
    postId: post.id,
    title: toPlainText(post?.title?.rendered),
    description: toPlainText(post?.excerpt?.rendered),
    // Only structured date available — the post publish date (see file header).
    startDate: post.date || '',
    endDate: '',
    location: '',
    links: post.link ? [{ label: 'thetezos.com', url: post.link }] : [],
    images: image ? [image] : [],
    createdBy: '',
    createdAt: post.date || '',
    updatedAt: post.modified || '',
    source: 'wp',
    readOnly: true,
  }
}

/**
 * Fetch a single page of events.
 * @param {number} page 1-based page number
 * @param {number} perPage
 * @returns {Promise<{ events: object[], totalPages: number }>}
 */
export async function fetchPage(page = 1, perPage = PER_PAGE) {
  const res = await fetch(`${API}?per_page=${perPage}&page=${page}&_embed=1`)
  if (!res.ok) throw new Error(`mec-events ${res.status} ${res.statusText}`)
  const totalPages = Number(res.headers.get('x-wp-totalpages')) || 1
  const data = await res.json()
  return { events: data.map(mapEvent), totalPages }
}
