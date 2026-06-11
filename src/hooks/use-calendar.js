import useSWR from 'swr'
import { calendarDB } from '@data/calendar'
import { useUserStore } from '@context/userStore'
import { CALENDAR_ADMINS } from '@constants'

const SWR_KEY = 'calendar/events'

/**
 * Read + mutate calendar events. Backend-agnostic: it only talks to
 * `calendarDB`, so swapping IndexedDB for Postgres later needs no change here.
 */
export function useCalendarEvents() {
  const { data, error, isLoading, mutate } = useSWR(SWR_KEY, () =>
    calendarDB.list()
  )

  return {
    events: data ?? [],
    error,
    isLoading,
    /** Re-read the list (call after a write). */
    refresh: mutate,
  }
}

// TEMPORARY (dev only): bypass the wallet gate so the calendar can be
// exercised without connecting a wallet. `import.meta.env.DEV` is false in
// production builds, so this is dead code there even if left `true`.
// Remove once real admin addresses are configured.
const MOCK_WALLET_GATE = true

/**
 * The wallet-owner edit gate. True when a wallet is connected and its address
 * is in {@link CALENDAR_ADMINS}. Components use this to show/hide editing UI.
 * In dev, {@link MOCK_WALLET_GATE} short-circuits this to always-true.
 */
export function useIsCalendarAdmin() {
  const address = useUserStore((st) => st.address)
  if (import.meta.env.DEV && MOCK_WALLET_GATE) return true
  return Boolean(address) && CALENDAR_ADMINS.includes(address)
}
