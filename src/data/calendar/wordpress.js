/**
 * WordPress read-only calendar source (thetezos.com).
 *
 * Events come from the MEC API (`mec/v1.0/events`), which exposes real
 * per-occurrence start/end dates, so they land on the day they actually happen
 * (recurring events are pre-expanded). It's token-gated and CORS-locked, so the
 * browser hits our own `/api/thetezos-events` proxy (Netlify function in prod,
 * Vite dev middleware locally) which adds the token server-side.
 *
 * Two scopes are fetched separately so the upcoming feed can paint first:
 *  - {@link fetchUpcomingEvents} — current + future (and ongoing events);
 *  - {@link fetchPastEvents} — past occurrences for the "Previous Events"
 *    accordion, `limit` controlling how far back they reach.
 *
 * These events are READ-ONLY — merged in at read time, never written back.
 */

/**
 * Fetch normalized events from the proxy.
 * @param {{ limit?: number, past?: boolean }} [opts]
 * @returns {Promise<object[]>}
 */
async function fetchProxy({ limit = 100, past = false } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (past) params.set('past', '1')
  const res = await fetch(`/api/thetezos-events?${params}`)
  if (!res.ok)
    throw new Error(`thetezos-events ${res.status} ${res.statusText}`)
  const { events } = await res.json()
  return Array.isArray(events) ? events : []
}

/** Upcoming + ongoing events with real dates. */
export function fetchUpcomingEvents(limit = 100) {
  return fetchProxy({ limit, past: false })
}

/** Past events with real dates (newest first; `limit` sets how far back). */
export function fetchPastEvents(limit = 200) {
  return fetchProxy({ limit, past: true })
}
