// Build the sidebar tree from on-chain pages joined with the IPFS metadata.
// Hierarchy is resolved to page ids (the IPFS `parent` slug is mapped to an id
// in hooks.ts before this runs).

import type { WikiPage, WikiTreeNode, WikiSortKey } from './types'

/** Per-id metadata pulled from each page's IPFS document. */
export interface WikiPageMeta {
  title: string
  /** The page's own slug (for pretty links / parent matching). */
  slug: string
  /** Resolved parent page id, or null for a top-level page. */
  parent: number | null
}

/** Comparators for sibling ordering. Date keys sort most-recent first. */
const COMPARATORS: Record<
  WikiSortKey,
  (a: WikiTreeNode, b: WikiTreeNode) => number
> = {
  title: (a, b) => a.title.localeCompare(b.title),
  created: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  updated: (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
}

function createsCycle(
  id: number,
  parentId: number | null,
  byId: Map<number, WikiTreeNode>
): boolean {
  let cur: number | null = parentId
  const seen = new Set<number>()
  while (cur !== null && !seen.has(cur)) {
    if (cur === id) return true
    seen.add(cur)
    cur = byId.get(cur)?.parent ?? null
  }
  return false
}

export function buildTree(
  pages: WikiPage[],
  meta: Record<number, WikiPageMeta>,
  sortBy: WikiSortKey = 'title'
): WikiTreeNode[] {
  const byId = new Map<number, WikiTreeNode>()

  for (const page of pages) {
    const m = meta[page.id]
    byId.set(page.id, {
      id: page.id,
      title: m?.title || `Page ${page.id}`,
      parent: m?.parent ?? null,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      children: [],
    })
  }

  const roots: WikiTreeNode[] = []
  for (const node of byId.values()) {
    const parent = node.parent !== null ? byId.get(node.parent) : undefined
    if (parent && !createsCycle(node.id, node.parent, byId)) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const compare = COMPARATORS[sortBy] ?? COMPARATORS.title
  const sortRec = (nodes: WikiTreeNode[]) => {
    nodes.sort(compare)
    nodes.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)

  return roots
}
