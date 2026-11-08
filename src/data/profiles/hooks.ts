// SWR hooks for on-chain profiles.

import useSWR from 'swr'
import { fetchProfile, fetchProfiles } from './api'
import { profileKey } from './actions'
import { fetchProfileContent } from './ipfs'
import type { ChainProfile, ResolvedProfile } from './types'

const SWR_OPTIONS = { revalidateOnFocus: false, dedupingInterval: 15_000 }

/** Join a profile record with its IPFS document (soft-failing the fetch). */
async function resolve(profile: ChainProfile): Promise<ResolvedProfile> {
  const content = await fetchProfileContent(profile.cid).catch(() => undefined)
  return { ...profile, content }
}

/**
 * One wallet's on-chain profile card with its document (hidden ones
 * included, for the owner and moderators). `profile` is null when the wallet
 * has no card.
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
 * Profile cards for a page of addresses (artist directory), keyed by address.
 * One TzKT request for the records plus one IPFS fetch per card found.
 * Hidden cards are left out.
 */
export function useChainProfiles(addresses: string[]) {
  return useSWR<Record<string, ResolvedProfile>>(
    addresses.length ? ['profiles/many', addresses.join(',')] : null,
    async () => {
      const found = [...(await fetchProfiles(addresses)).values()].filter(
        (p) => !p.hidden
      )
      const resolved = await Promise.all(found.map(resolve))
      return Object.fromEntries(resolved.map((p) => [p.address, p]))
    },
    SWR_OPTIONS
  )
}
