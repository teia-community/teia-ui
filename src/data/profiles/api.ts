// Read the on-chain profile card registry from its bigmap via TzKT.

import { PROFILES_CONTRACT } from '@constants'
import type { ChainProfile } from './types'

const TZKT_API = import.meta.env.VITE_TZKT_API
const BIGMAPS = `${TZKT_API}/v1/contracts/${PROFILES_CONTRACT}/bigmaps`
// Keeps the `key.in` query string well under URL length limits.
const ADDRESS_BATCH = 100

interface RawProfileValue {
  current_cid: string
  hidden: boolean
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
  hidden: row.value.hidden,
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

/**
 * Every profile card, hidden ones included, most recently updated first — for
 * the moderation console.
 */
export async function fetchAllProfiles(): Promise<ChainProfile[]> {
  const rows = await getJson<Row[]>(
    `${BIGMAPS}/profiles/keys?active=true&sort.desc=lastLevel&select=key,value&limit=1000`
  )
  return rows.map(toProfile)
}

/** Read a single address's profile, or null if it has none. */
export async function fetchProfile(
  address: string
): Promise<ChainProfile | null> {
  return (await fetchProfiles([address])).get(address) ?? null
}
