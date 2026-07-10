import { useEffect } from 'react'
import useSWR from 'swr'
import { fetchPage, fetchUpcomingEvents } from '@data/calendar/wordpress'
import { fetchChainCalendarEvents } from '@data/calendar-chain'
import { useUserStore } from '@context/userStore'
import { useGateRoles } from '@data/roles'
import { toInstant, localDayKey } from '@utils/datetime'

const SWR_KEY = 'calendar/events'

/**
 * WordPress event population is read-only and lives only in memory. We load it
 * once per session into a module-level cache and notify any mounted hook each
 * time more events arrive so the calendar fills in live. Two sources feed it:
 * the MEC proxy for upcoming events (real dates, fast first paint) and the old
 * `wp/v2` endpoint (post dates) for past events only.
 */
let wpCache = []
let wpStarted = false
const wpSubscribers = new Set()

// On-chain events, fetched once per SWR load and cached at module scope so the
// progressive WP re-merges below don't drop them.
let chainCache = []

function notifyWp() {
  for (const fn of wpSubscribers) fn()
}

/** First day of the current month, YYYY-MM-DD (local). */
function currentMonthStart() {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${m}-01`
}

/** Kick off the one-time WP load (idempotent). */
function startWpLoad() {
  if (wpStarted) return
  wpStarted = true
  ;(async () => {
    // 1. Upcoming events with real dates — the primary feed, fast first paint.
    let upcomingPostIds = new Set()
    try {
      const upcoming = await fetchUpcomingEvents()
      wpCache = upcoming
      upcomingPostIds = new Set(upcoming.map((e) => e.postId))
      notifyWp()
    } catch {
      // No upcoming feed just means fewer events, not a broken calendar.
    }

    // 2. Past events (old endpoint, post dates) for the "Previous Events"
    // accordion. Keep only events strictly before this month, and skip any
    // whose post already appears in the upcoming feed.
    const threshold = currentMonthStart()
    try {
      const first = await fetchPage(1)
      const keepPast = (events) =>
        events.filter(
          (e) =>
            !upcomingPostIds.has(e.postId) &&
            localDayKey(e.startDate) < threshold
        )
      const firstPast = keepPast(first.events)
      if (firstPast.length) {
        wpCache = wpCache.concat(firstPast)
        notifyWp()
      }
      for (let page = 2; page <= first.totalPages; page++) {
        const { events } = await fetchPage(page)
        const past = keepPast(events)
        if (past.length) {
          wpCache = wpCache.concat(past)
          notifyWp()
        }
      }
    } catch {
      // Leave whatever loaded; a failed background page just means fewer
      // past events.
    }
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
export function useCalendarEvents() {
  // Moderators additionally see hidden on-chain events (so they can unhide).
  const address = useUserStore((st) => st.address)
  const { data: roles } = useGateRoles(address)
  const canModerate = Boolean(roles?.canModerate)

  const { data, error, isLoading, mutate } = useSWR(SWR_KEY, async () => {
    // A chain read failure just means no on-chain events, not a broken feed.
    chainCache = await fetchChainCalendarEvents({
      includeHidden: canModerate,
      viewerAddress: address,
    }).catch(() => [])
    startWpLoad()
    return combine()
  })

  // Re-fetch when the viewer's address or moderator status resolves — both
  // change which hidden events are visible (own self-hidden / all).
  useEffect(() => {
    mutate()
  }, [canModerate, address, mutate])

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
