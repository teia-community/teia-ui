// SWR hooks for on-chain profiles.

import useSWR from 'swr'
import {
  fetchHandleBlocked,
  fetchHandleOwner,
  fetchProfile,
  fetchProfiles,
} from './api'
import { isValidHandle, profileKey } from './actions'
import { fetchProfileContent } from './ipfs'
import type { ChainProfile, ResolvedProfile } from './types'

const SWR_OPTIONS = { revalidateOnFocus: false, dedupingInterval: 15_000 }

/** Join a profile record with its IPFS document (soft-failing the fetch). */
async function resolve(profile: ChainProfile): Promise<ResolvedProfile> {
  const content = await fetchProfileContent(profile.cid).catch(() => undefined)
  return { ...profile, content }
}

/**
 * One address's on-chain profile with its document. `profile` is null when
 * the address has none (fall back to SUBJKT metadata).
 */
export function useChainProfile(address?: string) {
  const { data, error, mutate } = useSWR<ResolvedProfile | null>(
    address ? profileKey(address) : null,
    async () => {
      const profile = await fetchProfile(address as string)
      return profile ? resolve(profile) : null
    },
    SWR_OPTIONS
  )
  return {
    profile: data ?? null,
    error,
    isLoading: Boolean(address) && data === undefined && !error,
    refresh: mutate,
  }
}

/**
 * Profiles for a page of addresses (artist directory), keyed by address. One
 * TzKT request for the records plus one IPFS fetch per profile found.
 * Moderated profiles are left out.
 */
export function useChainProfiles(addresses: string[]) {
  return useSWR<Record<string, ResolvedProfile>>(
    addresses.length ? ['profiles/many', addresses.join(',')] : null,
    async () => {
      const found = [...(await fetchProfiles(addresses)).values()].filter(
        (p) => !p.moderated
      )
      const resolved = await Promise.all(found.map(resolve))
      return Object.fromEntries(resolved.map((p) => [p.address, p]))
    },
    SWR_OPTIONS
  )
}

export type HandleStatus = 'invalid' | 'taken' | 'blocked' | 'available'

/**
 * Whether a handle can be claimed, for live feedback in a form. `undefined`
 * while checking; pass a debounced value.
 */
export function useHandleStatus(handle: string): HandleStatus | undefined {
  const valid = isValidHandle(handle)
  const { data } = useSWR<HandleStatus>(
    valid ? ['profiles/handle', handle] : null,
    async () => {
      const [owner, blocked] = await Promise.all([
        fetchHandleOwner(handle),
        fetchHandleBlocked(handle),
      ])
      if (blocked) return 'blocked'
      return owner ? 'taken' : 'available'
    },
    SWR_OPTIONS
  )
  if (!handle) return undefined
  return valid ? data : 'invalid'
}
