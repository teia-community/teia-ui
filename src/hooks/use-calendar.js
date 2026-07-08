import { useEffect } from 'react'
import useSWR from 'swr'
import { fetchPage } from '@data/calendar/wordpress'
import { fetchChainCalendarEvents } from '@data/calendar-chain'
import { useUserStore } from '@context/userStore'
import { useGateRoles } from '@data/roles'

const SWR_KEY = 'calendar/events'

/**
 * WordPress event population is read-only and lives only in memory. We load it
 * once per session into a module-level cache, progressively (page 1 first for a
 * fast paint, then the remaining pages in the background), and notify any
 * mounted hook each time more events arrive so the calendar fills in live.
 */
let wpCache = []
let wpStarted = false
const wpSubscribers = new Set()
// WP ids the user "kicked out of state". They never come back during the
// session, even as later background pages stream in.
const dismissed = new Set()

// On-chain events, fetched once per SWR load and cached at module scope so the
// progressive WP re-merges below don't drop them.
let chainCache = []

function notifyWp() {
  for (const fn of wpSubscribers) fn()
}

/** Kick off the one-time progressive WP load (idempotent). */
function startWpLoad() {
  if (wpStarted) return
  wpStarted = true
  ;(async () => {
    try {
      const first = await fetchPage(1)
      wpCache = first.events
      notifyWp()
      for (let page = 2; page <= first.totalPages; page++) {
        const { events } = await fetchPage(page)
        wpCache = wpCache.concat(events)
        notifyWp()
      }
    } catch {
      // Leave whatever loaded; a failed background page just means fewer
      // events, not a broken calendar.
    }
  })()
}

/**
 * Merge on-chain + (non-dismissed) WordPress events, de-duped by id and
 * date-sorted. Ids are namespaced per source (chain-, wp-) so they never
 * collide.
 */
function combine() {
  const map = new Map()
  for (const ev of chainCache) {
    if (!dismissed.has(ev.id)) map.set(ev.id, ev)
  }
  for (const ev of wpCache) {
    if (!dismissed.has(ev.id)) map.set(ev.id, ev)
  }
  return [...map.values()].sort((a, b) =>
    (a.startDate || '').localeCompare(b.startDate || '')
  )
}

/**
 * Read calendar events.
 *
 * Reads merge two sources: the on-chain calendar contract (authoritative) and
 * the WordPress `mec-events` feed (in-memory, read-only). Writes go on-chain via
 * `@data/calendar-chain`; read-only WP events are dismissed via {@link dismiss}.
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
    }).catch(() => [])
    startWpLoad()
    return combine()
  })

  // Re-fetch when the viewer's moderator status resolves (toggles hidden events).
  useEffect(() => {
    mutate()
  }, [canModerate, mutate])

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
    /** Kick a read-only WP event out of state for the rest of the session. */
    dismiss: (id) => {
      dismissed.add(id)
      mutate(combine(), { revalidate: false })
    },
  }
}
