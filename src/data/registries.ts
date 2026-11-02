// Network config for the teiaEvents / teiaProfiles registries
// (src/data/events-chain, src/data/profiles).
//
// Neither contract is on mainnet yet, so both features are off unless the app
// runs in shadownet test mode (see .env.shadownet). In that mode the
// registries are read from shadownet TzKT and roles are resolved against the
// shadownet multisig / moderator / token contracts, while the rest of the app
// keeps reading mainnet. At mainnet launch this module goes away: the data
// layers switch to VITE_TZKT_API and useGateRoles.

import useSWR from 'swr'
import { useUserStore } from '@context/userStore'

const env = import.meta.env

export const REGISTRY_TZKT_API: string | undefined =
  env.VITE_REGISTRIES_TZKT_API
export const REGISTRIES_ENABLED = Boolean(REGISTRY_TZKT_API)

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

async function fetchRoles(address: string) {
  const api = `${REGISTRY_TZKT_API}/v1`
  const [users, moderators, balances] = await Promise.all([
    getJson<string[]>(
      `${api}/contracts/${env.VITE_REGISTRIES_MULTISIG}/storage?path=users`
    ),
    getJson<string[]>(
      `${api}/contracts/${env.VITE_REGISTRIES_MODERATOR}/storage?path=moderators`
    ),
    getJson<string[]>(
      `${api}/tokens/balances?account=${address}&token.contract=${env.VITE_REGISTRIES_TOKEN}&token.tokenId=0&select=balance`
    ),
  ])
  return {
    canModerate: users.includes(address) || moderators.includes(address),
    canPropose: balances.some((b) => Number(b) > 0),
  }
}

export interface RegistryRoles {
  /** Connected wallet address. */
  address?: string
  /** Moderator or multisig member on the registries' network. */
  canModerate: boolean
  /** Holds TEIA on the registries' network — can propose events. */
  canPropose: boolean
  isConnected: boolean
  /** Roles are still resolving for a connected wallet. */
  loading: boolean
}

/** The connected account's capabilities on the registries' network. */
export function useRegistryRoles(): RegistryRoles {
  const address = useUserStore((st) => st.address)
  const { data, error } = useSWR(
    REGISTRIES_ENABLED && address ? ['registries/roles', address] : null,
    () => fetchRoles(address as string),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
  return {
    address,
    canModerate: Boolean(data?.canModerate),
    canPropose: Boolean(data?.canPropose),
    isConnected: Boolean(address),
    loading: REGISTRIES_ENABLED && Boolean(address) && !data && !error,
  }
}
