// SWR hooks for the wiki

import useSWR from 'swr'
import {
  fetchAllWikiEvents,
  fetchPageVersions,
  reconstructState,
} from './api'
import { fetchPageContent } from './ipfs'
import { fetchUserRoles } from './roles'
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
  meta: Record<string, WikiPageMeta>
  tree: WikiTreeNode[]
}

async function fetchWiki(): Promise<WikiData> {
  const events = await fetchAllWikiEvents()
  const { pages, proposals } = reconstructState(events)

  // Recover title + parent from each page's IPFS doc
  const results = await Promise.allSettled(
    pages.map((p) => fetchPageContent(p.cid))
  )
  const meta: Record<string, WikiPageMeta> = {}
  pages.forEach((page, i) => {
    const r = results[i]
    if (r.status === 'fulfilled') {
      meta[page.slug] = {
        title: r.value.title || page.slug,
        parent: r.value.parent ?? null,
      }
    } else {
      meta[page.slug] = { title: page.slug, parent: null }
    }
  })

  return { pages, proposals, meta, tree: buildTree(pages, meta) }
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
export function useWikiVersions(slug: string | undefined) {
  return useSWR<WikiVersion[]>(
    slug ? `wiki:versions:${slug}` : null,
    () => fetchPageVersions(slug as string),
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
