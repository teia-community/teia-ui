// SWR hooks for the wiki

import useSWR from 'swr'
import {
  fetchPages,
  fetchProposals,
  fetchPageVersions,
  fetchWikiPaused,
} from './api'
import { fetchPageContent } from './ipfs'
import { fetchUserRoles } from './roles'
import { slugify } from './links'
import { buildTree, type WikiPageMeta } from './tree'
import { WIKI_SWR_KEY } from './actions'
import type {
  WikiPage,
  WikiPageContent,
  WikiProposal,
  WikiTreeNode,
  WikiUserRoles,
  WikiVersion,
} from './types'

export interface WikiData {
  pages: WikiPage[]
  proposals: WikiProposal[]
  /** Per-page-id metadata (title, slug, resolved parent id). */
  meta: Record<number, WikiPageMeta>
  /** Maps an IPFS doc slug to its page id (for legacy slug URLs + links). */
  slugToId: Record<string, number>
  tree: WikiTreeNode[]
  paused: boolean
}

async function fetchWiki(): Promise<WikiData> {
  const [{ pages }, proposals, paused] = await Promise.all([
    fetchPages(),
    fetchProposals(),
    fetchWikiPaused(),
  ])

  // Recover title + slug + parent(slug) from each page's IPFS doc.
  const docs = await Promise.allSettled(
    pages.map((p) => fetchPageContent(p.cid))
  )

  // First pass: index each page by both its stored slug and its current
  // title-derived slug, so parent links (which reference the stored slug) and
  // pretty URLs (which follow the current title) both resolve.
  const slugToId: Record<string, number> = {}
  pages.forEach((page, i) => {
    const r = docs[i]
    if (r.status !== 'fulfilled') return
    if (r.value.slug) slugToId[r.value.slug] = page.id
    const titleSlug = slugify(r.value.title || '')
    if (titleSlug) slugToId[titleSlug] = page.id
  })

  const meta: Record<number, WikiPageMeta> = {}
  pages.forEach((page, i) => {
    const r = docs[i]
    if (r.status === 'fulfilled') {
      const parentSlug = r.value.parent ?? null
      // The pretty URL follows the current title, not the (possibly stale)
      // stored slug. A renamed page gets a URL matching its new title.
      const titleSlug = slugify(r.value.title || '')
      meta[page.id] = {
        title: r.value.title || `Page ${page.id}`,
        slug: titleSlug || r.value.slug || '',
        parent: parentSlug ? slugToId[parentSlug] ?? null : null,
      }
    } else {
      meta[page.id] = { title: `Page ${page.id}`, slug: '', parent: null }
    }
  })

  return {
    pages,
    proposals,
    meta,
    slugToId,
    tree: buildTree(pages, meta),
    paused,
  }
}

/** Full wiki state: pages, proposals, sidebar tree. */
export function useWiki() {
  return useSWR<WikiData>(WIKI_SWR_KEY, fetchWiki, {
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  })
}

/** The page document (markdown content + metadata) for a given CID. */
export function useWikiPageContent(cid: string | undefined) {
  return useSWR<WikiPageContent>(
    cid ? `wiki:content:${cid}` : null,
    () => fetchPageContent(cid as string),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

/** Full version history of a page, newest first. */
export function useWikiVersions(pageId: number | undefined) {
  return useSWR<WikiVersion[]>(
    pageId !== undefined ? `wiki:versions:${pageId}` : null,
    () => fetchPageVersions(pageId as number),
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

/** Current user's wiki capabilities (moderator / multisig / token holder). */
export function useWikiRoles(address: string | undefined) {
  return useSWR<WikiUserRoles>(
    address ? `wiki:roles:${address}` : 'wiki:roles:anon',
    () => fetchUserRoles(address),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}
