// Shared account-role data layer.
//
// Resolves whether an address is a multisig user, a moderator, and/or a Teia
// (DAO) token holder. 
//
// Reused only by the wiki today, and intended for a future per-address role badge.
// NOTE: `useMultisigAddresses` in `@data/swr` still exists and is unchanged;
// these two paths will be consolidated later.

import useSWR from 'swr'
import {
  DAO_TREASURY_CONTRACT,
  MODERATOR_CONTRACT,
  DAO_TOKEN_CONTRACT,
  WIKI_TOKEN_ID,
} from '@constants'
import { fetchGraphQL } from '@data/api'

const TZKT_API = import.meta.env.VITE_TZKT_API

export interface AccountRoles {
  /** Member of the DAO treasury multisig. */
  isMultisig: boolean
  /** Listed in the moderator contract. */
  isModerator: boolean
  /** Holds at least one Teia (DAO) token. */
  isTokenHolder: boolean
}

// ---------------------------------------------------------------------------
// Plain fetchers
// ---------------------------------------------------------------------------

/** Multisig users — DAO treasury storage `users` set. */
export async function fetchMultisigUsers(): Promise<string[]> {
  const res = await fetch(
    `${TZKT_API}/v1/contracts/${DAO_TREASURY_CONTRACT}/storage?path=users`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Standalone moderators — moderator contract storage `moderators` set. */
export async function fetchModerators(): Promise<string[]> {
  const res = await fetch(
    `${TZKT_API}/v1/contracts/${MODERATOR_CONTRACT}/storage?path=moderators`
  )
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Teia DAO token balance (raw) for a single address. */
export async function fetchTokenBalance(address: string): Promise<number> {
  const url = new URL(`${TZKT_API}/v1/tokens/balances`)
  url.searchParams.set('account', address)
  url.searchParams.set('token.contract', DAO_TOKEN_CONTRACT)
  url.searchParams.set('token.tokenId', String(WIKI_TOKEN_ID))
  url.searchParams.set('select', 'balance')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: string[] = await res.json()
  return rows.reduce((sum, b) => sum + Number(b || 0), 0)
}

/**
 * Batched Teia DAO token balances for many addresses (one request per ~50).
 * Returns a Map address -> raw balance. Useful for rendering many role badges.
 */
export async function fetchAccountsTokenBalances(
  addresses: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  const unique = [...new Set(addresses.filter(Boolean))]
  const CHUNK = 50

  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK)
    const url = new URL(`${TZKT_API}/v1/tokens/balances`)
    url.searchParams.set('account.in', slice.join(','))
    url.searchParams.set('token.contract', DAO_TOKEN_CONTRACT)
    url.searchParams.set('token.tokenId', String(WIKI_TOKEN_ID))
    url.searchParams.set('select', 'account,balance')
    url.searchParams.set('limit', '10000')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
    const rows: { account: { address: string }; balance: string }[] =
      await res.json()
    for (const row of rows) {
      const addr = row.account?.address
      if (addr) out.set(addr, (out.get(addr) || 0) + Number(row.balance || 0))
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// SWR hooks
// ---------------------------------------------------------------------------

/** Cached multisig users list. */
export function useMultisigUsers() {
  return useSWR<string[]>('roles:multisig-users', fetchMultisigUsers, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
}

/** Cached moderators list. */
export function useModerators() {
  return useSWR<string[]>('roles:moderators', fetchModerators, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
}

/**
 * Resolve a single address to its roles. The two membership lists are shared
 * across all callers (deduped by SWR); only the token balance is per-address.
 */
export function useAccountRoles(address?: string): AccountRoles {
  const { data: users } = useMultisigUsers()
  const { data: moderators } = useModerators()
  const { data: balance } = useSWR(
    address ? ['roles:balance', address] : null,
    () => fetchTokenBalance(address as string),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  return {
    isMultisig: Boolean(address && users?.includes(address)),
    isModerator: Boolean(address && moderators?.includes(address)),
    isTokenHolder: (balance ?? 0) > 0,
  }
}

// ---------------------------------------------------------------------------
// Profiles (alias + avatar)
// ---------------------------------------------------------------------------

/** Display profile for an address: alias (name) and avatar (logo). */
export interface UserProfile {
  alias?: string
  logo?: string
}

interface TeiaUserRow {
  user_address: string
  name?: string | null
  metadata?: { data?: { identicon?: string | null } | null } | null
}

/**
 * Batched (alias, avatar) lookup, subject to merge into a global lookup.
 */
export function useUserProfiles(addresses: string[]) {
  const unique = [...new Set((addresses ?? []).filter(Boolean))].sort()
  return useSWR<Record<string, UserProfile>>(
    unique.length > 0 ? `teia-user-profiles:${unique.join(',')}` : null,
    async () => {
      const result = await fetchGraphQL(
        `query UserProfiles($addresses: [String!]!) {
           teia_users(where: { user_address: { _in: $addresses } }) {
             user_address
             name
             metadata { data }
           }
         }`,
        'UserProfiles',
        { addresses: unique }
      )
      const out: Record<string, UserProfile> = {}
      for (const row of (result?.data?.teia_users ?? []) as TeiaUserRow[]) {
        out[row.user_address] = {
          alias: row.name ?? undefined,
          logo: row.metadata?.data?.identicon ?? undefined,
        }
      }
      return out
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}
