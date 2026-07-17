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

interface RawVersionValue {
  cid: string
  editor: string
  proposer: string | null
  ts: string
  version: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

type RawVersionRow = {
  key: { event_id: string; version: string }
  value: RawVersionValue
}

function indexVersions(rows: RawVersionRow[]): Map<string, RawVersionValue> {
  const versions = new Map<string, RawVersionValue>()
  for (const row of rows) {
    versions.set(`${row.key.event_id}:${row.key.version}`, row.value)
  }
  return versions
}

function mapEventRow(
  row: { key: string; value: RawEventValue },
  versions: Map<string, RawVersionValue>
): ChainEvent {
  const id = Number(row.key)
  const versionCount = Number(row.value.version_count)
  const current = versions.get(`${id}:${versionCount}`)
  const first = versions.get(`${id}:1`)
  return {
    id,
    cid: row.value.current_cid,
    hidden: row.value.hidden,
    versionCount,
    creator: row.value.creator ?? null,
    modLocked: Boolean(row.value.mod_locked),
    editor: current?.editor ?? '',
    proposer: current?.proposer ?? null,
    createdAt: first?.ts ?? current?.ts ?? '',
    updatedAt: current?.ts ?? first?.ts ?? '',
  }
}

/** Read every event from the `events` bigmap, joined with its versions. */
export async function fetchEvents(): Promise<ChainEvent[]> {
  const [eventRows, versionRows] = await Promise.all([
    getJson<{ key: string; value: RawEventValue }[]>(
      `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/events/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
    ),
    getJson<RawVersionRow[]>(
      `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/versions/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
    ),
  ])
  const versions = indexVersions(versionRows)
  return eventRows.map((row) => mapEventRow(row, versions)).sort((a, b) => a.id - b.id)
}

/**
 * Read a single event by id
 */
export async function fetchChainEvent(id: number): Promise<ChainEvent | null> {
  const [eventRows, versionRows] = await Promise.all([
    getJson<{ key: string; value: RawEventValue }[]>(
      `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/events/keys?active=true&key=${id}&select=key,value`
    ),
    getJson<RawVersionRow[]>(
      `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/versions/keys?active=true&key.event_id=${id}&select=key,value&limit=${MAX_PAGE_SIZE}`
    ),
  ])
  if (!eventRows.length) return null
  return mapEventRow(eventRows[0], indexVersions(versionRows))
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
