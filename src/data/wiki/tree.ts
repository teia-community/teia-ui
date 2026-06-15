// Build the sidebar tree from on-chain pages joined with the IPFS `parent` field.

import type { WikiPage, WikiTreeNode, WikiSortKey } from './types'

/** Per-slug metadata pulled from each page's IPFS document. */
export interface WikiPageMeta {
  title: string
  parent: string | null
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
  slug: string,
  parentSlug: string | null,
  bySlug: Map<string, WikiTreeNode>
): boolean {
  let cur: string | null = parentSlug
  const seen = new Set<string>()
  while (cur && !seen.has(cur)) {
    if (cur === slug) return true
    seen.add(cur)
    cur = bySlug.get(cur)?.parent ?? null
  }
  return false
}

export function buildTree(
  pages: WikiPage[],
  meta: Record<string, WikiPageMeta>,
  sortBy: WikiSortKey = 'title'
): WikiTreeNode[] {
  const bySlug = new Map<string, WikiTreeNode>()

  for (const page of pages) {
    const m = meta[page.slug]
    bySlug.set(page.slug, {
      slug: page.slug,
      title: m?.title || page.slug,
      parent: m?.parent ?? null,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      children: [],
    })
  }

  const roots: WikiTreeNode[] = []
  for (const node of bySlug.values()) {
    const parent = node.parent ? bySlug.get(node.parent) : undefined
    if (parent && !createsCycle(node.slug, node.parent, bySlug)) {
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
