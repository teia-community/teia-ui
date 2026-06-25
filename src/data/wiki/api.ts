// Fetch the wiki's current state from its bigmaps via TzKT.


import { WIKI_CONTRACT } from '@constants'
import type { WikiPage, WikiProposal, WikiVersion } from './types'

const TZKT_API = import.meta.env.VITE_TZKT_API
const MAX_PAGE_SIZE = 10000

interface RawPageValue {
  current_cid: string
  hidden: boolean
  version_count: string
}

interface RawVersionValue {
  cid: string
  editor: string
  proposer: string | null
  ts: string
  version: string
}

interface RawProposalTarget {
  edit?: string
  new_page?: unknown
}

interface RawProposalValue {
  target: RawProposalTarget
  proposed_cid: string
  proposer: string
  status: string
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

/** Whether the contract is currently paused (all writes revert when true). */
export async function fetchWikiPaused(): Promise<boolean> {
  try {
    const storage = await getJson<{ paused?: boolean }>(
      `${TZKT_API}/v1/contracts/${WIKI_CONTRACT}/storage`
    )
    return Boolean(storage.paused)
  } catch {
    return false
  }
}

const PROPOSAL_STATUS = ['pending', 'approved', 'rejected'] as const

/**
 * Read every page from the `pages` bigmap, joined with its first/current
 * version from the `versions` bigmap to recover editor/proposer/timestamps
 * (the page record itself only carries cid/hidden/version_count).
 */
export async function fetchPages(): Promise<{
  pages: WikiPage[]
  versions: Map<string, RawVersionValue>
}> {
  const [pageRows, versionRows] = await Promise.all([
    getJson<{ key: string; value: RawPageValue }[]>(
      `${TZKT_API}/v1/contracts/${WIKI_CONTRACT}/bigmaps/pages/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
    ),
    getJson<
      { key: { page_id: string; version: string }; value: RawVersionValue }[]
    >(
      `${TZKT_API}/v1/contracts/${WIKI_CONTRACT}/bigmaps/versions/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
    ),
  ])

  // Index versions by `${page_id}:${version}` for the join below.
  const versions = new Map<string, RawVersionValue>()
  for (const row of versionRows) {
    versions.set(`${row.key.page_id}:${row.key.version}`, row.value)
  }

  const pages: WikiPage[] = pageRows.map((row) => {
    const id = Number(row.key)
    const versionCount = Number(row.value.version_count)
    const current = versions.get(`${id}:${versionCount}`)
    const first = versions.get(`${id}:1`)
    return {
      id,
      cid: row.value.current_cid,
      hidden: row.value.hidden,
      versionCount,
      editor: current?.editor ?? '',
      proposer: current?.proposer ?? null,
      createdAt: first?.ts ?? current?.ts ?? '',
      updatedAt: current?.ts ?? first?.ts ?? '',
    }
  })

  pages.sort((a, b) => a.id - b.id)
  return { pages, versions }
}

/** Read every community proposal from the `proposals` bigmap. */
export async function fetchProposals(): Promise<WikiProposal[]> {
  const rows = await getJson<{ key: string; value: RawProposalValue }[]>(
    `${TZKT_API}/v1/contracts/${WIKI_CONTRACT}/bigmaps/proposals/keys?active=true&select=key,value&limit=${MAX_PAGE_SIZE}`
  )

  return rows
    .map((row) => {
      const isNewPage = row.value.target.new_page !== undefined
      const pageId =
        row.value.target.edit !== undefined
          ? Number(row.value.target.edit)
          : null
      const status = PROPOSAL_STATUS[Number(row.value.status)] ?? 'pending'
      return {
        id: row.key,
        pageId,
        proposedCid: row.value.proposed_cid,
        proposer: row.value.proposer,
        isNewPage,
        status,
        createdAt: row.value.created_at,
        resolvedBy: row.value.resolved_by ?? undefined,
        resolvedAt: row.value.resolved_at ?? undefined,
      } as WikiProposal
    })
    .sort((a, b) => Number(a.id) - Number(b.id))
}

/**
 * Read the full version history of one page from the `versions` bigmap,
 * filtering by `key.page_id`. Newest version first.
 */
export async function fetchPageVersions(
  pageId: number
): Promise<WikiVersion[]> {
  const url = new URL(
    `${TZKT_API}/v1/contracts/${WIKI_CONTRACT}/bigmaps/versions/keys`
  )
  url.searchParams.set('active', 'true')
  url.searchParams.set('select', 'key,value')
  url.searchParams.set('key.page_id', String(pageId))
  url.searchParams.set('limit', String(MAX_PAGE_SIZE))

  const rows = await getJson<
    { key: { page_id: string; version: string }; value: RawVersionValue }[]
  >(url.toString())

  return rows
    .map((row) => ({
      pageId: Number(row.key.page_id),
      version: Number(row.key.version),
      cid: row.value.cid,
      editor: row.value.editor,
      proposer: row.value.proposer ?? null,
      timestamp: row.value.ts,
    }))
    .sort((a, b) => b.version - a.version)
}
