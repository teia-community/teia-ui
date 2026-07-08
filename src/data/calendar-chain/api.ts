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

/**
 * Read every event from the `events` bigmap, joined with its current/first
 * entry in the `versions` bigmap to recover editor/proposer/timestamps (the
 * event record itself only carries cid/hidden/version_count).
 */
export async function fetchEvents(): Promise<ChainEvent[]> {
  const [eventRows, versionRows] = await Promise.all([
    getJson<{ key: string; value: RawEventValue }[]>(
      `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/events/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
    ),
    getJson<
      {
        key: { event_id: string; version: string }
        value: RawVersionValue
      }[]
    >(
      `${TZKT_API}/v1/contracts/${CALENDAR_CONTRACT}/bigmaps/versions/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
    ),
  ])

  // Index versions by `${event_id}:${version}` for the join below.
  const versions = new Map<string, RawVersionValue>()
  for (const row of versionRows) {
    versions.set(`${row.key.event_id}:${row.key.version}`, row.value)
  }

  return eventRows
    .map((row) => {
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
    })
    .sort((a, b) => a.id - b.id)
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
