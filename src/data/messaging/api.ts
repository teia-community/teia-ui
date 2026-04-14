import { MESSAGING_TZKT_API } from '@constants'
import type { TzktEvent } from './channel-types'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 1000

/**
 * Fetch a single page of contract events from TzKT.
 * Returns newest first by default (for message views).
 */
export async function fetchEventsPage<P>(
  contract: string,
  tag: string,
  params: Record<string, string> = {},
  options: { limit?: number; offset?: number; sort?: 'asc' | 'desc' } = {}
): Promise<TzktEvent<P>[]> {
  const { limit = DEFAULT_PAGE_SIZE, offset = 0, sort = 'desc' } = options

  const url = new URL(`${MESSAGING_TZKT_API}/v1/contracts/events`)
  url.searchParams.set('contract', contract)
  url.searchParams.set('tag', tag)
  url.searchParams.set(`sort.${sort}`, 'id')
  url.searchParams.set('limit', String(limit))
  if (offset > 0) {
    url.searchParams.set('offset', String(offset))
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`TzKT error: ${res.status}`)
  }
  return res.json()
}

/**
 * Fetch ALL events of a given tag, paging through limit+offset.
 * Used for channel/room lists
 * Returns in ascending order (oldest first).
 */
export async function fetchAllEvents<P>(
  contract: string,
  tag: string,
  params: Record<string, string> = {}
): Promise<TzktEvent<P>[]> {
  const all: TzktEvent<P>[] = []
  let offset = 0

  let hasMore = true
  while (hasMore) {
    const page = await fetchEventsPage<P>(contract, tag, params, {
      limit: MAX_PAGE_SIZE,
      offset,
      sort: 'asc',
    })
    all.push(...page)
    hasMore = page.length === MAX_PAGE_SIZE
    offset += MAX_PAGE_SIZE
  }

  return all
}

/**
 * Fetch contract storage from TzKT.
 */
export async function fetchContractStorage<T>(
  contract: string
): Promise<T> {
  const res = await fetch(
    `${MESSAGING_TZKT_API}/v1/contracts/${contract}/storage`
  )
  if (!res.ok) {
    throw new Error(`TzKT error: ${res.status}`)
  }
  return res.json()
}

/**
 * Fetch a single value from a named bigmap.
 * Returns null if the key doesn't exist (404).
 */
export async function fetchBigMapValue<V>(
  contract: string,
  bigmapName: string,
  key: string
): Promise<V | null> {
  const res = await fetch(
    `${MESSAGING_TZKT_API}/v1/contracts/${contract}/bigmaps/${bigmapName}/keys/${key}`
  )
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`TzKT error: ${res.status}`)
  }
  const data = await res.json()
  return data.value
}

/**
 * Fetch keys from a bigmap by numeric ID.
 * Supports composite key filtering via params.
 */
export async function fetchBigMapKeys<V>(
  bigmapId: number,
  params: Record<string, string> = {}
): Promise<{ key: unknown; value: V }[]> {
  const url = new URL(`${MESSAGING_TZKT_API}/v1/bigmaps/${bigmapId}/keys`)
  url.searchParams.set('active', 'true')
  url.searchParams.set('select', 'key,value')

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`TzKT error: ${res.status}`)
  }
  return res.json()
}
