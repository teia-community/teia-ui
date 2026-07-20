import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { fetchUpcomingEvents, fetchPastEvents } from '@data/calendar/wordpress'
import {
  fetchChainCalendarEvents,
  fetchChainEventById,
} from '@data/calendar-chain'
import { useUserStore } from '@context/userStore'
import { useGateRoles } from '@data/roles'
import { toInstant } from '@utils/datetime'

const SWR_KEY = 'calendar/events'

/**
 * WordPress event population is read-only and lives only in memory. We load it
 * once per session into a module-level cache and notify any mounted hook each
 * time more events arrive so the calendar fills in live. Both scopes (upcoming
 * and past) come from the MEC proxy with real dates; the upcoming feed paints
 * first, past events stream in behind it.
 */
let wpCache = []
let wpStarted = false
// Flips true once both WP fetches have settled.
let wpDone = false
const wpSubscribers = new Set()

// On-chain events, fetched once per SWR load and cached at module scope so the
// progressive WP re-merges below don't drop them.
let chainCache = []

function notifyWp() {
  for (const fn of wpSubscribers) fn()
}

/** Kick off the one-time WP load (idempotent). */
function startWpLoad() {
  if (wpStarted) return
  wpStarted = true
  ;(async () => {
    // 1. Upcoming + ongoing events — the primary feed, fast first paint.
    try {
      wpCache = await fetchUpcomingEvents()
      notifyWp()
    } catch {
      // A failed feed just means fewer events, not a broken calendar.
    }

    // 2. Past events for the "Previous Events" accordion. Occurrence ids are
    // shared with the upcoming feed, so the recent-past overlap de-dupes on id.
    try {
      const past = await fetchPastEvents()
      const seen = new Set(wpCache.map((e) => e.id))
      const fresh = past.filter((e) => !seen.has(e.id))
      if (fresh.length) {
        wpCache = wpCache.concat(fresh)
        notifyWp()
      }
    } catch {
      // Past events failing just means an emptier Previous Events accordion.
    }

    wpDone = true
    notifyWp()
  })()
}

/**
 * Merge on-chain + WordPress events, de-duped by id and date-sorted. Ids are
 * namespaced per source (chain-, wp-) so they never collide.
 */
function combine() {
  const map = new Map()
  for (const ev of chainCache) map.set(ev.id, ev)
  for (const ev of wpCache) map.set(ev.id, ev)
  return [...map.values()].sort((a, b) => {
    const ia = toInstant(a.startDate)
    const ib = toInstant(b.startDate)
    return (
      (Number.isNaN(ia) ? Infinity : ia) - (Number.isNaN(ib) ? Infinity : ib)
    )
  })
}

/**
 * Read calendar events.
 *
 * Reads merge two sources: the on-chain calendar contract (authoritative) and
 * the WordPress `mec-events` feed (in-memory, read-only). Writes go on-chain via
 * `@data/calendar-chain`.
 */
export function useCalendarEvents({ enabled = true } = {}) {
  // Moderators additionally see hidden on-chain events (so they can unhide).
  const address = useUserStore((st) => st.address)
  const { data: roles } = useGateRoles(address)
  const canModerate = Boolean(roles?.canModerate)

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? SWR_KEY : null,
    async () => {
      // A chain read failure just means no on-chain events, not a broken feed.
      chainCache = await fetchChainCalendarEvents({
        includeHidden: canModerate,
        viewerAddress: address,
      }).catch(() => [])
      startWpLoad()
      return combine()
    }
  )

  // Re-fetch when the viewer's address or moderator status resolves — both
  // change which hidden events are visible (own self-hidden / all).
  const viewerKey = `${address ?? ''}:${canModerate}`
  const prevViewerKey = useRef(viewerKey)
  useEffect(() => {
    if (prevViewerKey.current === viewerKey) return
    prevViewerKey.current = viewerKey
    mutate()
  }, [viewerKey, mutate])

  // Re-merge whenever a background WP page lands.
  useEffect(() => {
    const onWp = () => mutate(combine(), { revalidate: false })
    wpSubscribers.add(onWp)
    return () => wpSubscribers.delete(onWp)
  }, [mutate])

  return {
    events: data ?? [],
    error,
    isLoading,
    /** Re-read the feed. */
    refresh: mutate,
  }
}

/**
 * From the occurrences of one WP event (they share a slug), pick the one to
 * feature on its detail page. If the whole series is past, the most recent, plus the
 * remaining upcoming occurrences (date order) for an "upcoming dates" list.
 */
function pickSeries(occurrences) {
  const now = Date.now()
  const dated = occurrences
    .map((e) => ({
      e,
      start: toInstant(e.startDate),
      end: toInstant(e.endDate || e.startDate),
    }))
    .filter((x) => !Number.isNaN(x.start))
    .sort((a, b) => a.start - b.start)
  if (!dated.length) return { event: occurrences[0] ?? null, upcoming: [] }
  const live = dated.filter(
    (x) => (Number.isNaN(x.end) ? x.start : x.end) >= now
  )
  if (live.length) {
    return { event: live[0].e, upcoming: live.slice(1).map((x) => x.e) }
  }
  // Whole series is in the past — feature the most recent, nothing upcoming.
  return { event: dated[dated.length - 1].e, upcoming: [] }
}

/**
 * Resolve a single calendar event by its display id, for the dedicated event
 * URL. Chain events (`chain-<n>`) resolve standalone from the contract, so a
 * cold/direct link works; an `::<iso>` occurrence suffix is normalized to the
 * series. WordPress events resolve from the in-memory feed by their name (WP
 * `slug`) — one page per series — featuring the current/next occurrence; an
 * exact occurrence id (`wp-<postId>-<date>`) still resolves for older links.
 *
 * @param {string} id display id, e.g. `chain-12` or an event slug
 * @returns {{ event: object|null, upcoming: object[], isLoading: boolean, notFound: boolean, error: any }}
 */
export function useCalendarEvent(id) {
  const address = useUserStore((st) => st.address)
  const { data: roles } = useGateRoles(address)
  const canModerate = Boolean(roles?.canModerate)

  const isChain = typeof id === 'string' && id.startsWith('chain-')
  const eventId = isChain ? id.slice('chain-'.length).split('::')[0] : null

  // Chain events resolve on their own (cold-load friendly).
  const chain = useSWR(
    isChain && eventId
      ? ['calendar/event', eventId, canModerate, address]
      : null,
    () =>
      fetchChainEventById(eventId, {
        includeHidden: canModerate,
        viewerAddress: address,
      })
  )

  // WP events live only in the in-memory feed.
  const feed = useCalendarEvents({ enabled: !isChain })

  if (isChain) {
    return {
      event: chain.data ?? null,
      upcoming: [],
      isLoading: chain.isLoading,
      notFound: !chain.isLoading && !chain.error && chain.data === null,
      error: chain.error,
    }
  }

  // Prefer the slug (name) match
  const bySlug = feed.events.filter((e) => e.slug && e.slug === id)
  // If a title collision ever lets a slug match more than
  // one chain event, keep only the occurrences of the lowest eventId
  const bySlugEventIds = [
    ...new Set(bySlug.map((e) => e.eventId).filter((v) => v !== undefined)),
  ]
  const narrowedBySlug =
    bySlugEventIds.length > 1
      ? bySlug.filter((e) => e.eventId === Math.min(...bySlugEventIds))
      : bySlug
  let occurrences = narrowedBySlug
  if (!occurrences.length) {
    const exact = feed.events.find((e) => e.id === id)
    occurrences = exact
      ? exact.slug
        ? feed.events.filter((e) => e.slug === exact.slug)
        : [exact]
      : []
  }
  const { event, upcoming } = pickSeries(occurrences)
  return {
    event,
    upcoming,
    isLoading: feed.isLoading || !wpDone,
    notFound: wpDone && !event,
    error: feed.error,
  }
}
