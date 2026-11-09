// Pure helpers for per-page metadata (title, description, canonical URL).
// Kept free of DOM/React imports so they can run under `node --test`.

export const SITE_URL = 'https://teia.art'

export const DEFAULT_DESCRIPTION =
  'Teia is an open-source NFT marketplace dApp powered by the Tezos blockchain; teia.art is a fork of former tezos NFT marketplace hic et nunc and is developed and maintained by the Teia Community of artists, collectors, and hackers.'

/** Browser tab title for a page. */
export function pageTitle(title) {
  return title ? `${title} - teia` : 'teia'
}

/** Canonical URL of a path on teia.art: no query, no hash, no trailing slash. */
export function canonicalUrl(pathname) {
  const path = `/${pathname || ''}`
    .split(/[?#]/)[0]
    .replace(/\/{2,}/g, '/')
    .replace(/\/+$/, '')
  return `${SITE_URL}${path}`
}

/**
 * Plain-text summary of a markdown document, for a meta description.
 * Drops headings' markers, images, link targets, code fences and HTML tags,
 * then cuts at a word boundary.
 */
export function summarize(markdown, max = 160) {
  if (!markdown) return ''
  const text = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(
    /[\s.,;:!?-]+$/,
    ''
  )}…`
}
