import useSWR from 'swr'
import { EVENTS_API_PATH, fetchEvents } from '@data/events/api'
import { EVENTS_SWR_KEY, fetchShowcaseEvents } from '@data/events-chain'
import { REGISTRIES_ENABLED } from '@data/registries'

// On-chain registry in shadownet test mode, the mocked GET /events otherwise.
const [KEY, fetcher] = REGISTRIES_ENABLED
  ? [EVENTS_SWR_KEY, () => fetchShowcaseEvents()]
  : [EVENTS_API_PATH, fetchEvents]

// Stable reference while loading, so effects keyed on `events` don't loop.
const EMPTY = []

/** Read the normalized events feed through the same SWR boundary as calendar. */
export function useEvents() {
  const { data, error, mutate } = useSWR(KEY, fetcher)

  return {
    events: data ?? EMPTY,
    error,
    isLoading: !data && !error,
    refresh: mutate,
  }
}
