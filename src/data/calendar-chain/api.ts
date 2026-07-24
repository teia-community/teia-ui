// Read the on-chain calendar state from its bigmaps via TzKT
// (mirrors src/data/wiki/api.ts).

import { CALENDAR_CONTRACT } from '@constants'
import type { ChainEvent, CalendarProposal } from './types'

const PROPOSAL_STATUS = ['pending', 'approved', 'rejected'] as const

interface RawProposalValue {
  target: { edit?: string; new_event?: unknown }
  proposed_cid: string
  proposer: string
  status: string
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
}

const TZKT_API = import.meta.env.VITE_TZKT_API
const MAX_PAGE_SIZE = 10000

interface RawEventValue {
  current_cid: string
  hidden: boolean
  version_count: string
  creator: string | null
  mod_locked: boolean
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

// Version history is no longer stored on-chain: the contract emits a version
// record (tag event_created / event_updated) on every mutation instead of
// keeping a `versions` big_map. The calendar UI displays none of that per-
// version metadata (editor/proposer/created/updated), so we read only the
// `events` big_map and leave those fields empty. To surface a history/last-
// edited-by view, replay the emitted events via TzKT's contract-events API
// (see CALENDAR_CONTRACT_V2_MIGRATION.md, Option B).
function mapEventRow(row: { key: string; value: RawEventValue }): ChainEvent {
  return {
    id: Number(row.key),
    cid: row.value.current_cid,
    hidden: row.value.hidden,
    versionCount: Number(row.value.version_count),
    creator: row.value.creator ?? null,
    modLocked: Boolean(row.value.mod_locked),
    editor: '',
    proposer: null,
    createdAt: '',
    updatedAt: '',
  }
}

/** Read every event from the `events` bigmap. */
export async function fetchEvents(): Promise<ChainEvent[]> {
  const eventRows = await getJson<{ key: string; value: RawEventValue }[]>(
    `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/events/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
  )
  return eventRows.map(mapEventRow).sort((a, b) => a.id - b.id)
}

/**
 * Read a single event by id
 */
export async function fetchChainEvent(id: number): Promise<ChainEvent | null> {
  const eventRows = await getJson<{ key: string; value: RawEventValue }[]>(
    `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/events/keys?active=true&key=${id}&select=key,value`
  )
  if (!eventRows.length) return null
  return mapEventRow(eventRows[0])
}

/** Read every community proposal from the `proposals` bigmap. */
export async function fetchProposals(): Promise<CalendarProposal[]> {
  const rows = await getJson<{ key: string; value: RawProposalValue }[]>(
    `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/proposals/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
  )

  return rows
    .map((row) => {
      const isNewEvent = row.value.target.new_event !== undefined
      const eventId =
        row.value.target.edit !== undefined
          ? Number(row.value.target.edit)
          : null
      const status = PROPOSAL_STATUS[Number(row.value.status)] ?? 'pending'
      return {
        id: row.key,
        eventId,
        proposedCid: row.value.proposed_cid,
        proposer: row.value.proposer,
        isNewEvent,
        status,
        createdAt: row.value.created_at,
        resolvedBy: row.value.resolved_by ?? undefined,
        resolvedAt: row.value.resolved_at ?? undefined,
      } as CalendarProposal
    })
    .sort((a, b) => Number(a.id) - Number(b.id))
}
