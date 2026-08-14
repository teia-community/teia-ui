// Fetch the curations' current state from the `curations` bigmap via TzKT.

import { CURATIONS_CONTRACT } from '@constants'
import { TZKT_API, MAX_PAGE_SIZE, getJson } from '@data/tzkt-bigmap'
import type { Curation } from './types'

interface RawCurationValue {
  owner: string
  current_cid: string
  hidden: boolean
  version_count: string
}

/**
 * Read every curation from the `curations` bigmap. Will be changed soon
 */
export async function fetchCurations(): Promise<Curation[]> {
  const rows = await getJson<{ key: string; value: RawCurationValue }[]>(
    `${TZKT_API}/v1/contracts/${CURATIONS_CONTRACT}/bigmaps/curations/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
  )

  const curations: Curation[] = rows.map((row) => ({
    id: Number(row.key),
    owner: row.value.owner,
    cid: row.value.current_cid,
    hidden: row.value.hidden,
    versionCount: Number(row.value.version_count),
  }))

  curations.sort((a, b) => a.id - b.id)
  return curations
}
