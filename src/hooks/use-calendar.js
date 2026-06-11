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
