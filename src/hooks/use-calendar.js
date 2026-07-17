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
 * Resolve a single calendar event by its display id, for the dedicated event
 * URL. Chain events (`chain-<n>`) resolve standalone from the contract, so a
 * cold/direct link works; an `::<iso>` occurrence suffix is normalized to the
 * series. WordPress events (`wp-…`) are found in the in-memory feed.
 *
 * @param {string} id display id, e.g. `chain-12` or `wp-345-2026-07-01`
 * @returns {{ event: object|null, isLoading: boolean, notFound: boolean, error: any }}
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
      isLoading: chain.isLoading,
      notFound: !chain.isLoading && !chain.error && chain.data === null,
      error: chain.error,
    }
  }

  const event = feed.events.find((e) => e.id === id) ?? null
  return {
    event,
    isLoading: feed.isLoading || !wpDone,
    notFound: wpDone && !event,
    error: feed.error,
  }
}
