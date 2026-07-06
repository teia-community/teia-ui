// Slug-based URL helpers for the wiki. 
// Pages are keyed on-chain by numeric id, but URLs display the human-readable slug (from the IPFS doc) 
// Falling back to the numeric id for pages without a slug.

import type { WikiData } from './hooks'
import type { WikiPageMeta } from './tree'

/** Derive a URL-safe slug from a page title. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Resolve a route `:id` param (numeric id or slug) to its numeric page id. */
export function resolvePageId(
  wiki: WikiData | undefined,
  idParam: string | undefined
): number | undefined {
  if (!idParam) return undefined
  if (/^\d+$/.test(idParam)) return Number(idParam)
  return wiki?.slugToId?.[idParam]
}

/** Canonical URL segment for a page: its slug if present, else the numeric id. */
export function wikiSeg(
  meta: Record<number, WikiPageMeta> | undefined,
  id: number
): string {
  return meta?.[id]?.slug || String(id)
}
