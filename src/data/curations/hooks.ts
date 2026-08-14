// SWR hooks for curations.

import useSWR from 'swr'
import { fetchCurations } from './api'
import { fetchCurationContent } from './ipfs'
import { useGateRoles } from '@data/roles'
import { CURATIONS_SWR_KEY } from './actions'
import type { Curation, CurationContent, CurationUserRoles } from './types'

/** Every curation, sorted by id. */
export function useCurations() {
  return useSWR<Curation[]>(CURATIONS_SWR_KEY, fetchCurations, {
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  })
}

/** A single curation by id (derived from the full list). */
export function useCuration(id: number | undefined) {
  const { data, error, mutate } = useCurations()
  const curation =
    id === undefined ? undefined : data?.find((c) => c.id === id)
  return { curation, data, error, isLoading: !data && !error, mutate }
}

/** Every curation owned by `address` (derived from the full list). */
export function useCurationsByOwner(address: string | undefined) {
  const { data, error, mutate } = useCurations()
  const curations = address
    ? (data ?? []).filter((c) => c.owner === address)
    : []
  return { curations, error, isLoading: !data && !error, mutate }
}

// The curation document (title/description/tokens/fee) for a given CID.
export function useCurationContent(cid: string | undefined) {
  return useSWR<CurationContent>(
    cid ? `curations:content:${cid}` : null,
    () => fetchCurationContent(cid as string),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )
}

/** Current user's curation capabilities (moderator / multisig / token holder). */
export function useCurationRoles(address: string | undefined): {
  data?: CurationUserRoles
} {
  const { data } = useGateRoles(address)
  return {
    data: data && {
      isModerator: data.isModerator,
      isMultisig: data.isMultisig,
      canModerate: data.canModerate,
      canCreate: data.isTokenHolder,
    },
  }
}
