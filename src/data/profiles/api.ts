// Read the on-chain profile registry from its bigmaps via TzKT.

import { PROFILES_CONTRACT } from '@constants'
import { REGISTRY_TZKT_API } from '@data/registries'
import type { ChainProfile } from './types'

const BIGMAPS = `${REGISTRY_TZKT_API}/v1/contracts/${PROFILES_CONTRACT}/bigmaps`
// Keeps the `key.in` query string well under URL length limits.
const ADDRESS_BATCH = 100

interface RawProfileValue {
  current_cid: string
  handle: string | null
  moderated: boolean
  version_count: string
}

type Row = { key: string; value: RawProfileValue }

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

const toProfile = (row: Row): ChainProfile => ({
  address: row.key,
  cid: row.value.current_cid,
  handle: row.value.handle ?? null,
  moderated: row.value.moderated,
  versionCount: Number(row.value.version_count),
})

/**
 * Read the profiles of many addresses at once (artist directory page).
 * Returns only the addresses that have a profile, keyed by address.
 */
export async function fetchProfiles(
  addresses: string[]
): Promise<Map<string, ChainProfile>> {
  const batches: string[][] = []
  for (let i = 0; i < addresses.length; i += ADDRESS_BATCH) {
    batches.push(addresses.slice(i, i + ADDRESS_BATCH))
  }
  const pages = await Promise.all(
    batches.map((batch) =>
      getJson<Row[]>(
        // TzKT rejects `key.in` with fewer than two values.
        `${BIGMAPS}/profiles/keys?${
          batch.length === 1 ? `key=${batch[0]}` : `key.in=${batch.join(',')}`
        }&select=key,value&limit=${batch.length}`
      )
    )
  )
  return new Map(pages.flat().map((row) => [row.key, toProfile(row)]))
}

/** Read a single address's profile, or null if it has none. */
export async function fetchProfile(
  address: string
): Promise<ChainProfile | null> {
  return (await fetchProfiles([address])).get(address) ?? null
}

/**
 * A single bigmap key. TzKT answers 204 for a key that never existed and
 * still returns removed keys (with `active: false`), so both mean "absent".
 */
async function fetchActiveKey<V>(
  bigmap: string,
  key: string
): Promise<{ value: V } | null> {
  const res = await fetch(
    `${BIGMAPS}/${bigmap}/keys/${encodeURIComponent(key)}`
  )
  if (res.status === 204 || res.status === 404) return null
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const body = await res.json()
  return body?.active ? body : null
}

/** The address currently holding a handle, or null if it is unclaimed. */
export async function fetchHandleOwner(handle: string): Promise<string | null> {
  return (await fetchActiveKey<string>('handles', handle))?.value ?? null
}

/** Whether a handle is blocked (reserved route name or moderator-blocked). */
export async function fetchHandleBlocked(handle: string): Promise<boolean> {
  return (await fetchActiveKey<unknown>('blocked_handles', handle)) !== null
}

/** Resolve a handle to its owner's profile (profile pages by handle). */
export async function fetchProfileByHandle(
  handle: string
): Promise<ChainProfile | null> {
  const owner = await fetchHandleOwner(handle)
  return owner ? fetchProfile(owner) : null
}
