/**
 * WordPress (Modern Events Calendar) read-only calendar source.
 *
 * Pulls events from thetezos.com's `wp/v2/mec-events` REST endpoint and maps
 * each post onto our {@link import('./schema').CalendarEvent} shape so the same
 * UI renders them alongside locally-created (IndexedDB) events.
 *
 * ## Caveats baked into the mapping
 * - **No real event date is exposed by this endpoint.** MEC stores start/end
 *   dates under the `mec/v1` namespace, which we are not allowed to call. The
 *   only structured timestamp here is the WordPress publish `date`, so that is
 *   what we place on the calendar grid (`startDate`). It is the post date, not
 *   necessarily the day the event happens.
 * - `title` / `excerpt` come back as rendered HTML with entities; we strip tags
 *   and decode entities to plain text to match the card layout.
 * - The featured image only resolves to a URL when the request is made with
 *   `_embed=1` (`wp:featuredmedia[0].source_url`).
 *
 * These events are READ-ONLY. They are merged into state at read time and can
 * be dismissed ("kicked out of state") but never written back to the API.
 */

const API = 'https://thetezos.com/wp-json/wp/v2/mec-events'

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
