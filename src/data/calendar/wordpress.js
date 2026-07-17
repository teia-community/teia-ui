/**
 * WordPress read-only calendar source (thetezos.com).
 *
 * Events come from the MEC API (`mec/v1.0/events`), which exposes real
 * per-occurrence start/end dates, so they land on the day they actually happen
 * (recurring events are pre-expanded). The API accepts the token as
 * `Authorization: Bearer` with permissive CORS, so the browser calls it
 * directly — no proxy or serverless function needed (works on a static build).
 * The read-only token comes from `VITE_MEC_TOKEN`.
 *
 * Two scopes are fetched separately so the upcoming feed can paint first:
 *  - {@link fetchUpcomingEvents} — current + future (and ongoing events);
 *  - {@link fetchPastEvents} — past occurrences for the "Previous Events"
 *    accordion, `limit` controlling how far back they reach.
 *
 * These events are READ-ONLY — merged in at read time, never written back.
 */

import { fetchThetezosEvents } from './thetezos.mjs'

const TOKEN = import.meta.env.VITE_MEC_TOKEN

/** Upcoming + ongoing events with real dates. */
export function fetchUpcomingEvents(limit = 100) {
  return fetchThetezosEvents(TOKEN, { limit, past: false })
}

/** Past events with real dates (newest first; `limit` sets how far back). */
export function fetchPastEvents(limit = 200) {
  return fetchThetezosEvents(TOKEN, { limit, past: true })
}
