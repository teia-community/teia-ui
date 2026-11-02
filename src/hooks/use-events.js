import useSWR from 'swr'
import { EVENTS_SWR_KEY, fetchShowcaseEvents } from '@data/events-chain'

// Stable reference while loading, so effects keyed on `events` don't loop.
const EMPTY = []

/** The public events from the on-chain registry (hidden ones excluded). */
export function useEvents() {
  const { data, error, mutate } = useSWR(EVENTS_SWR_KEY, () =>
    fetchShowcaseEvents()
  )

  return {
    events: data ?? EMPTY,
    error,
    isLoading: !data && !error,
    refresh: mutate,
  }
}
