// Read the on-chain events registry from its bigmaps via TzKT
// (mirrors src/data/calendar-chain/api.ts).

import { EVENTS_CONTRACT } from '@constants'
import { REGISTRY_TZKT_API } from '@data/registries'
import type { ChainEventRecord, EventProposal } from './types'

const MAX_PAGE_SIZE = 10000
const BIGMAPS = `${REGISTRY_TZKT_API}/v1/contracts/${EVENTS_CONTRACT}/bigmaps`
const PROPOSAL_STATUS = ['pending', 'approved', 'rejected'] as const

interface RawEventValue {
  current_cid: string
  hidden: boolean
  version_count: string
  proposer: string | null
}

interface RawProposalValue {
  proposed_cid: string
  proposer: string
  status: string
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
}

type Row<V> = { key: string; value: V }

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

const toRecord = (row: Row<RawEventValue>): ChainEventRecord => ({
  id: Number(row.key),
  cid: row.value.current_cid,
  hidden: row.value.hidden,
  versionCount: Number(row.value.version_count),
  proposer: row.value.proposer ?? null,
})

/**
 * Read the `events` bigmap, oldest first. Hidden events are filtered out
 * server-side unless `includeHidden` is set (moderation console).
 */
export async function fetchEventRecords(
  includeHidden = false
): Promise<ChainEventRecord[]> {
  const rows = await getJson<Row<RawEventValue>[]>(
    `${BIGMAPS}/events/keys?${
      includeHidden ? '' : 'value.hidden=false&'
    }select=key,value&sort.asc=id&limit=${MAX_PAGE_SIZE}`
  )
  return rows.map(toRecord)
}

/** Read a single event record by id. */
export async function fetchEventRecord(
  id: number
): Promise<ChainEventRecord | null> {
  const rows = await getJson<Row<RawEventValue>[]>(
    `${BIGMAPS}/events/keys?key=${id}&select=key,value`
  )
  return rows.length ? toRecord(rows[0]) : null
}

/** Read every community proposal from the `proposals` bigmap. */
export async function fetchEventProposals(): Promise<EventProposal[]> {
  const rows = await getJson<Row<RawProposalValue>[]>(
    `${BIGMAPS}/proposals/keys?select=key,value&sort.asc=id&limit=${MAX_PAGE_SIZE}`
  )
  return rows.map((row) => ({
    id: row.key,
    proposedCid: row.value.proposed_cid,
    proposer: row.value.proposer,
    status: PROPOSAL_STATUS[Number(row.value.status)] ?? 'pending',
    createdAt: row.value.created_at,
    resolvedBy: row.value.resolved_by ?? undefined,
    resolvedAt: row.value.resolved_at ?? undefined,
  }))
}
