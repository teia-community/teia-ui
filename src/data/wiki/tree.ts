// Build the sidebar tree from on-chain pages joined with the IPFS `parent` field.

import type { WikiPage, WikiTreeNode } from './types'

/** Per-slug metadata pulled from each page's IPFS document. */
export interface WikiPageMeta {
  title: string
  parent: string | null
}

export function buildTree(
  pages: WikiPage[],
  meta: Record<string, WikiPageMeta>
): WikiTreeNode[] {
  const bySlug = new Map<string, WikiTreeNode>()

  for (const page of pages) {
    const m = meta[page.slug]
    bySlug.set(page.slug, {
      slug: page.slug,
      title: m?.title || page.slug,
      parent: m?.parent ?? null,
      children: [],
    })
  }

  const roots: WikiTreeNode[] = []
  for (const node of bySlug.values()) {
    const parent = node.parent ? bySlug.get(node.parent) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortRec = (nodes: WikiTreeNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title))
    nodes.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)

  return roots
}
