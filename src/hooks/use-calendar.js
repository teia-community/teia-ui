import { useEffect } from 'react'
import useSWR from 'swr'
import { calendarDB } from '@data/calendar'
import { fetchPage } from '@data/calendar/wordpress'
import { useUserStore } from '@context/userStore'
import { CALENDAR_ADMINS } from '@constants'

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

/** Merge local + (non-dismissed) WP events, de-duped by id and date-sorted. */
function combine(local) {
  const map = new Map()
  for (const ev of local) map.set(ev.id, ev)
  for (const ev of wpCache) {
    if (!dismissed.has(ev.id)) map.set(ev.id, ev)
  }
  return [...map.values()].sort((a, b) =>
    (a.startDate || '').localeCompare(b.startDate || '')
  )
}

/**
 * Read + mutate calendar events.
 *
 * Reads merge two sources: locally-created events (IndexedDB, writable) and the
 * WordPress `mec-events` feed (in-memory, read-only). Writes only ever touch the
 * local store; WP events are dismissed from state via {@link dismiss}.
 */
export function useCalendarEvents() {
  const { data, error, isLoading, mutate } = useSWR(SWR_KEY, async () => {
    const local = await calendarDB.list()
    startWpLoad()
    return combine(local)
  })

  // Re-merge whenever a background WP page lands.
  useEffect(() => {
    const onWp = () =>
      mutate(async () => combine(await calendarDB.list()), {
        revalidate: false,
      })
    wpSubscribers.add(onWp)
    return () => wpSubscribers.delete(onWp)
  }, [mutate])

  return {
    events: data ?? [],
    error,
    isLoading,
    /** Re-read the list (call after a local write). */
    refresh: mutate,
    /**
     * Kick a read-only WP event out of state for the rest of the session.
     * No-op for local events (those are deleted via calendarDB.remove).
     */
    dismiss: (id) => {
      dismissed.add(id)
      mutate(async () => combine(await calendarDB.list()), {
        revalidate: false,
      })
    },
  }
}

// TEMPORARY (demo stage): bypass the wallet gate so the calendar can be
// exercised without connecting a wallet — in dev AND deployed demos. Edits
// only touch the visitor's own browser-local IndexedDB, so this is harmless
// until a real shared backend lands. Set to false (or remove) to restore the
// CALENDAR_ADMINS allowlist gate.
const MOCK_WALLET_GATE = true

/**
 * The wallet-owner edit gate. True when a wallet is connected and its address
 * is in {@link CALENDAR_ADMINS}. Components use this to show/hide editing UI.
 * While {@link MOCK_WALLET_GATE} is on, it short-circuits to always-true.
 */
export function useIsCalendarAdmin() {
  const address = useUserStore((st) => st.address)
  if (MOCK_WALLET_GATE) return true
  return Boolean(address) && CALENDAR_ADMINS.includes(address)
}
