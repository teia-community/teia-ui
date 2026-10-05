// Platform activity for the calendar and wiki contracts.
// Testing a new way to read chain data

import useSWRInfinite from 'swr/infinite'
import { COPYRIGHT_CONTRACT } from '@constants'
import type { ActivitySort } from '@data/messaging/useSocialActivity'

const TZKT_API = import.meta.env.VITE_TZKT_API
const PAGE_SIZE = 50

export type ChainAction =
  | 'created'
  | 'updated'
  | 'hidden'
  | 'proposed'
  | 'accepted'
  | 'declined'

export interface ChainActivityConfig {
  /** SWR namespace, e.g. 'calendar' | 'wiki'. */
  ns: string
  contract: string
  /** Payload field prefix: 'event' (calendar) or 'page' (wiki). */
  itemPrefix: 'event' | 'page'
}

export interface ChainActivityItem {
  id: number
  action: ChainAction
  hidden?: boolean
  actor: string
  targetId: number | null
  proposalId: number | null
  isNew: boolean
  timestamp: string
  ophash: string | null
}

/** Filter chips for the chain feeds. */
export const CHAIN_ACTIVITY_FILTERS = [
  { key: 'created', label: 'Created' },
  { key: 'updated', label: 'Edited' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
]

function actionTags(prefix: string): Record<ChainAction, string[]> {
  return {
    created: [`${prefix}_created`],
    updated: [`${prefix}_updated`],
    hidden: [`${prefix}_hidden_updated`],
    proposed: ['proposal_created'],
    accepted: ['proposal_approved'],
    declined: ['proposal_rejected'],
  }
}

interface RawTzktEvent {
  id: number
  timestamp: string
  tag: string
  payload: Record<string, unknown> | null
  transactionId?: number
}

function parseItem(
  row: RawTzktEvent,
  config: ChainActivityConfig
): ChainActivityItem | null {
  const prefix = config.itemPrefix
  const tags = actionTags(prefix)
  const action = (Object.keys(tags) as ChainAction[]).find((a) =>
    tags[a].includes(row.tag)
  )
  if (!action) return null

  const pl = row.payload ?? {}
  const num = (v: unknown) => (v == null ? null : Number(v))
  const actor =
    pl.editor ?? pl.proposer ?? pl.approved_by ?? pl.rejected_by ?? ''

  return {
    id: row.id,
    action,
    hidden: action === 'hidden' ? pl.hidden === true : undefined,
    actor: String(actor),
    targetId: num(pl[`${prefix}_id`]),
    proposalId: num(pl.proposal_id),
    isNew: pl[`is_new_${prefix}`] === true,
    timestamp: (pl.timestamp as string) ?? row.timestamp,
    ophash: null,
  }
}

/** Resolve the operation hashes for a page of TzKT transaction ids. */
async function fetchTxHashes(txIds: number[]): Promise<Map<number, string>> {
  const hashes = new Map<number, string>()
  if (!txIds.length) return hashes

  const res = await fetch(
    `${TZKT_API}/v1/operations/transactions?id.in=${txIds.join(
      ','
    )}&select=id,hash&limit=${txIds.length}`
  )
  // Rows simply stay unlinked when the lookup fails.
  if (!res.ok) return hashes

  const rows: { id: number; hash: string }[] = await res.json()
  for (const row of rows) hashes.set(row.id, row.hash)
  return hashes
}

async function fetchChainActivityPage(
  config: ChainActivityConfig,
  tags: string[],
  offset: number,
  sort: 'asc' | 'desc' = 'desc'
): Promise<ChainActivityItem[]> {
  const url = new URL(`${TZKT_API}/v1/contracts/events`)
  url.searchParams.set('contract', config.contract)
  url.searchParams.set('tag.in', tags.join(','))
  url.searchParams.set(`sort.${sort}`, 'id')
  url.searchParams.set('limit', String(PAGE_SIZE))
  if (offset > 0) url.searchParams.set('offset', String(offset))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: RawTzktEvent[] = await res.json()

  const hashes = await fetchTxHashes([
    ...new Set(
      rows.map((row) => row.transactionId).filter(Boolean) as number[]
    ),
  ])

  return rows
    .map((row) => {
      const item = parseItem(row, config)
      if (!item) return null
      return {
        ...item,
        ophash: hashes.get(row.transactionId ?? -1) ?? null,
      }
    })
    .filter(Boolean) as ChainActivityItem[]
}

/**
 * Paginated activity feed for one chain contract. The active filter chips are
 * pushed into the TzKT query (`tag.in`), so pages stay full and toggling a
 * chip restarts pagination.
 */
export function useChainActivity(
  config: ChainActivityConfig,
  activeActions: string[] = [],
  sort: ActivitySort = 'newest'
) {
  const tagMap = actionTags(config.itemPrefix)
  const actions = (
    activeActions.length ? activeActions : Object.keys(tagMap)
  ) as ChainAction[]
  const tags = actions.flatMap((a) => tagMap[a] ?? [])
  const filterKey = activeActions.length
    ? [...activeActions].sort().join(',')
    : 'all'
  const dir = sort === 'oldest' ? 'asc' : 'desc'

  const getKey = (
    pageIndex: number,
    previousPageData: ChainActivityItem[] | null
  ) => {
    if (previousPageData && previousPageData.length === 0) return null
    return ['chain-activity', config.ns, filterKey, sort, pageIndex]
  }

  const { data, error, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    // SWR v1 spreads array-key parts as separate fetcher args.
    (
      _ns: string,
      _cns: string,
      _filters: string,
      _sort: ActivitySort,
      pageIndex: number
    ) => fetchChainActivityPage(config, tags, pageIndex * PAGE_SIZE, dir),
    { revalidateFirstPage: false, revalidateOnFocus: false }
  )

  const items = data ? data.flat() : []
  const isReachingEnd = Boolean(
    error || (data && data[data.length - 1]?.length < PAGE_SIZE)
  )
  const isLoadingMore = Boolean(
    isValidating && data && typeof data[size - 1] === 'undefined'
  )

  return {
    items,
    error,
    isLoadingInitial: !data && !error,
    isLoadingMore,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
  }
}

// --- Copyright agreements (creation only) ----------------------------------
// New keys in the contract's `copyrights` bigmap, timestamped via the TzKT
// bigmap-updates API. The key is { nat: agreement number, address: creator }.

export interface CopyrightActivityItem {
  id: number
  actor: string
  agreementId: number | null
  timestamp: string
  /** Block level of the update (bigmap updates carry no operation hash). */
  level: number | null
}

let copyrightBigmapId: Promise<number> | null = null

function getCopyrightBigmapId(): Promise<number> {
  if (!copyrightBigmapId) {
    copyrightBigmapId = fetch(
      `${TZKT_API}/v1/contracts/${COPYRIGHT_CONTRACT}/bigmaps/copyrights`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
        return res.json()
      })
      .then((bigmap) => bigmap.ptr as number)
      .catch((e) => {
        // Forget the failed lookup so the next page can retry.
        copyrightBigmapId = null
        throw e
      })
  }
  return copyrightBigmapId
}

async function fetchCopyrightPage(
  offset: number,
  sort: 'asc' | 'desc' = 'desc'
): Promise<CopyrightActivityItem[]> {
  const bigmap = await getCopyrightBigmapId()

  const url = new URL(`${TZKT_API}/v1/bigmaps/updates`)
  url.searchParams.set('bigmap', String(bigmap))
  url.searchParams.set('action', 'add_key')
  url.searchParams.set(`sort.${sort}`, 'id')
  url.searchParams.set('limit', String(PAGE_SIZE))
  if (offset > 0) url.searchParams.set('offset', String(offset))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: {
    id: number
    level?: number
    timestamp: string
    content?: { key?: { nat?: string; address?: string } }
  }[] = await res.json()

  return rows.map((row) => ({
    id: row.id,
    actor: String(row.content?.key?.address ?? ''),
    agreementId:
      row.content?.key?.nat != null ? Number(row.content.key.nat) : null,
    timestamp: row.timestamp,
    level: row.level ?? null,
  }))
}

/** New copyright agreements, with "load more" paging. */
export function useCopyrightActivity(sort: ActivitySort = 'newest') {
  const dir = sort === 'oldest' ? 'asc' : 'desc'

  const getKey = (
    pageIndex: number,
    previousPageData: CopyrightActivityItem[] | null
  ) => {
    if (previousPageData && previousPageData.length === 0) return null
    return ['copyright-activity', sort, pageIndex]
  }

  const { data, error, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    // SWR v1 spreads array-key parts as separate fetcher args.
    (_ns: string, _sort: ActivitySort, pageIndex: number) =>
      fetchCopyrightPage(pageIndex * PAGE_SIZE, dir),
    { revalidateFirstPage: false, revalidateOnFocus: false }
  )

  const items = data ? data.flat() : []
  const isReachingEnd = Boolean(
    error || (data && data[data.length - 1]?.length < PAGE_SIZE)
  )
  const isLoadingMore = Boolean(
    isValidating && data && typeof data[size - 1] === 'undefined'
  )

  return {
    items,
    error,
    isLoadingInitial: !data && !error,
    isLoadingMore,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
  }
}

export default useChainActivity
