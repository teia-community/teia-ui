// Fetch Wiki contract events from TzKT to create...
// current page list, proposal list and per-page version history

import { WIKI_CONTRACT } from '@constants'
import type {
  TzktEvent,
  WikiPage,
  WikiProposal,
  WikiVersion,
  PageCreatedEvent,
  PageUpdatedEvent,
  PageHiddenUpdatedEvent,
  ProposalCreatedEvent,
  ProposalApprovedEvent,
  ProposalRejectedEvent,
} from './types'
import { WIKI_EVENT_TAGS } from './types'

const TZKT_API = import.meta.env.VITE_TZKT_API
const MAX_PAGE_SIZE = 10000

/**
 * Fetch every event emitted by the wiki contract, oldest first.
 * Paginates defensively but in practice returns in one request.
 */
export async function fetchAllWikiEvents(): Promise<TzktEvent<unknown>[]> {
  const all: TzktEvent<unknown>[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const url = new URL(`${TZKT_API}/v1/contracts/events`)
    url.searchParams.set('contract', WIKI_CONTRACT)
    url.searchParams.set('sort.asc', 'id')
    url.searchParams.set('limit', String(MAX_PAGE_SIZE))
    if (offset > 0) url.searchParams.set('offset', String(offset))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
    const page: TzktEvent<unknown>[] = await res.json()

    all.push(...page)
    hasMore = page.length === MAX_PAGE_SIZE
    offset += MAX_PAGE_SIZE
  }

  return all
}

/**
 * Fetch every event touching a single page, oldest first.
 */
export async function fetchPageEvents(
  slug: string
): Promise<TzktEvent<unknown>[]> {
  const base = `${TZKT_API}/v1/contracts/events?contract=${WIKI_CONTRACT}&sort.asc=id&limit=${MAX_PAGE_SIZE}`

  const [bySlug, byPageSlug] = await Promise.all([
    fetch(`${base}&payload.slug=${encodeURIComponent(slug)}`),
    fetch(`${base}&payload.page_slug=${encodeURIComponent(slug)}`),
  ])
  if (!bySlug.ok || !byPageSlug.ok) throw new Error('TzKT error fetching page events')

  const merged: TzktEvent<unknown>[] = [
    ...(await bySlug.json()),
    ...(await byPageSlug.json()),
  ]
  merged.sort((a, b) => a.id - b.id)
  return merged
}

interface ReconstructedState {
  pages: WikiPage[]
  proposals: WikiProposal[]
}

/**
 * Fold the full event stream into the current set of pages and proposals.
 *
 * Note on edit-proposal approvals: the contract does NOT emit `page_updated`
 * when an edit proposal is approved, only `proposal_approved`. 
 */
export function reconstructState(
  events: TzktEvent<unknown>[]
): ReconstructedState {
  const pages = new Map<string, WikiPage>()
  const proposals = new Map<string, WikiProposal>()

  for (const ev of events) {
    switch (ev.tag) {
      case WIKI_EVENT_TAGS.PAGE_CREATED: {
        const p = ev.payload as PageCreatedEvent
        pages.set(p.slug, {
          slug: p.slug,
          cid: p.cid,
          hidden: p.hidden,
          versionCount: 1,
          editor: p.editor,
          createdAt: p.timestamp,
          updatedAt: p.timestamp,
        })
        break
      }
      case WIKI_EVENT_TAGS.PAGE_UPDATED: {
        const p = ev.payload as PageUpdatedEvent
        const existing = pages.get(p.slug)
        if (existing) {
          existing.cid = p.cid
          existing.hidden = p.hidden
          existing.versionCount = Number(p.version)
          existing.editor = p.editor
          existing.updatedAt = p.timestamp
        }
        break
      }
      case WIKI_EVENT_TAGS.PAGE_HIDDEN_UPDATED: {
        const p = ev.payload as PageHiddenUpdatedEvent
        const existing = pages.get(p.slug)
        if (existing) {
          existing.hidden = p.hidden
          existing.editor = p.editor
          existing.updatedAt = p.timestamp
        }
        break
      }
      case WIKI_EVENT_TAGS.PROPOSAL_CREATED: {
        const p = ev.payload as ProposalCreatedEvent
        proposals.set(p.proposal_id, {
          id: p.proposal_id,
          pageSlug: p.page_slug,
          proposedCid: p.proposed_cid,
          proposer: p.proposer,
          isNewPage: p.is_new_page,
          status: 'pending',
          createdAt: p.timestamp,
          transactionId: ev.transactionId,
        })
        break
      }
      case WIKI_EVENT_TAGS.PROPOSAL_APPROVED: {
        const p = ev.payload as ProposalApprovedEvent
        const prop = proposals.get(p.proposal_id)
        if (prop) {
          prop.status = 'approved'
          prop.resolvedBy = p.approved_by
          prop.resolvedAt = p.timestamp
        }
        // New-page approvals also emit page_created (handled above). For edit
        // approvals, advance the page here since no page_updated is emitted.
        if (!p.is_new_page) {
          const existing = pages.get(p.page_slug)
          if (existing) {
            existing.cid = p.proposed_cid
            existing.versionCount += 1
            existing.editor = p.approved_by
            existing.updatedAt = p.timestamp
          }
        }
        break
      }
      case WIKI_EVENT_TAGS.PROPOSAL_REJECTED: {
        const p = ev.payload as ProposalRejectedEvent
        const prop = proposals.get(p.proposal_id)
        if (prop) {
          prop.status = 'rejected'
          prop.resolvedBy = p.rejected_by
          prop.resolvedAt = p.timestamp
        }
        break
      }
    }
  }

  return {
    pages: Array.from(pages.values()),
    proposals: Array.from(proposals.values()),
  }
}

interface RawVersionValue {
  cid: string
  editor: string
  proposer: string | null
  ts: string
  version: string
}

/**
 * Read the full version history of a page from the `versions` bigmap.
 * The bigmap key is a record(slug, version); we filter by `key.slug`.
 * Authoritative for version metadata (editor, proposer, timestamp, cid).
 */
export async function fetchPageVersions(slug: string): Promise<WikiVersion[]> {
  const url = new URL(
    `${TZKT_API}/v1/contracts/${WIKI_CONTRACT}/bigmaps/versions/keys`
  )
  url.searchParams.set('active', 'true')
  url.searchParams.set('select', 'key,value')
  url.searchParams.set('key.slug', slug)
  url.searchParams.set('limit', String(MAX_PAGE_SIZE))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  const rows: { key: { slug: string; version: string }; value: RawVersionValue }[] =
    await res.json()

  return rows
    .map((row) => ({
      slug: row.key.slug,
      version: Number(row.key.version),
      cid: row.value.cid,
      editor: row.value.editor,
      proposer: row.value.proposer ?? null,
      timestamp: row.value.ts,
    }))
    .sort((a, b) => b.version - a.version)
}

/** Resolve a TzKT operation id to its operation hash (for tzkt.io links). */
export async function fetchOpHash(
  transactionId: number
): Promise<string | null> {
  const res = await fetch(
    `${TZKT_API}/v1/operations/transactions?id=${transactionId}&select=hash`
  )
  if (!res.ok) return null
  const rows: string[] = await res.json()
  return rows[0] ?? null
}
