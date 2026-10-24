// What a contract charges right now, asked of the contract.
//
// Fees were bundled into the front end as constants and sent as the amount on
// every write. That is fine until the core team changes one: the page shows
// the old figure and, worse, the wallet sends the old amount, which the
// contract rejects. Reads here are cached briefly, since a write is already
// several round trips and a fee changes about once a year.

import useSWR from 'swr'

const TZKT_API = import.meta.env.VITE_TZKT_API
/** Long enough to cover a burst of writes, short enough to notice a change. */
const TTL_MS = 60_000

interface Cached {
  value: number
  at: number
}

const cache = new Map<string, Cached>()

/**
 * A single fee field from a contract's storage, in mutez.
 *
 * `fallback` is the value compiled into the app. It is used only when the
 * indexer cannot be reached, where the choice is between the last known
 * figure and refusing to let anyone post at all.
 */
export async function getContractFee(
  contract: string,
  field: string,
  fallback: number
): Promise<number> {
  const key = `${contract}:${field}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  try {
    const res = await fetch(
      `${TZKT_API}/v1/contracts/${contract}/storage?path=${field}`
    )
    if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
    const raw = await res.json()
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`unusable fee: ${JSON.stringify(raw)}`)
    }
    cache.set(key, { value, at: Date.now() })
    return value
  } catch (error) {
    console.warn(
      `Could not read ${field} from ${contract}; using the bundled value`,
      error
    )
    return fallback
  }
}

/**
 * The same fee, for anything that quotes it before the user commits. A screen
 * that promises one amount and a wallet that asks for another is worse than
 * either being briefly out of date.
 */
export function useContractFee(
  contract: string,
  field: string,
  fallback: number
) {
  const { data } = useSWR([`fee:${contract}:${field}`], () =>
    getContractFee(contract, field, fallback)
  )
  return data ?? fallback
}

/** Forgets what has been read, so a changed fee is picked up at once. */
export function clearContractFeeCache() {
  cache.clear()
}

export default getContractFee
