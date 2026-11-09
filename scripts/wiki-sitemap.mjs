#!/usr/bin/env node
// Refreshes the wiki entries of build/sitemap.xml after `npm run build`.
//
// Wiki pages live on-chain, so the list committed in public/sitemap.xml goes
// stale as pages are added, renamed or hidden. This reads the visible pages
// from the wiki contract (the same TzKT + IPFS reads the app makes) and
// rewrites the /wiki/... entries. It never fails the build: if anything goes
// wrong, the committed list is left in place.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const SITE = 'https://teia.art'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TIMEOUT_MS = 8000

/** Same rule as slugify() in src/data/wiki/links.ts. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** URL path of a wiki page, as the app links to it (title slug, slug, or id). */
export function wikiPath(doc, id) {
  return `/wiki/${slugify(doc?.title || '') || doc?.slug || id}`
}

async function getJson(url, fetchImpl) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`${res.status} from ${url}`)
  return res.json()
}

async function getDoc(cid, gateways, fetchImpl) {
  for (const gateway of gateways) {
    try {
      return await getJson(`${gateway}${cid}`, fetchImpl)
    } catch {
      // try the next gateway
    }
  }
  throw new Error(`no gateway returned ${cid}`)
}

/**
 * The visible wiki pages as sitemap entries: [{ path, lastmod }].
 * Hidden pages are left out. Throws if any visible page cannot be read, so a
 * partial list never replaces the committed one.
 */
export async function fetchWikiEntries({
  tzkt,
  contract,
  gateways,
  fetchImpl = fetch,
}) {
  const base = `${tzkt}/v1/contracts/${contract}/bigmaps`
  const query = 'keys?active=true&select=key,value&limit=10000'
  const [pages, versions] = await Promise.all([
    getJson(`${base}/pages/${query}`, fetchImpl),
    getJson(`${base}/versions/${query}`, fetchImpl),
  ])

  const editedAt = new Map(
    versions.map((v) => [`${v.key.page_id}:${v.key.version}`, v.value.ts])
  )

  const visible = pages.filter((p) => !p.value.hidden)
  const entries = await Promise.all(
    visible.map(async (p) => {
      const doc = await getDoc(p.value.current_cid, gateways, fetchImpl)
      const ts = editedAt.get(`${p.key}:${p.value.version_count}`)
      return {
        path: wikiPath(doc, p.key),
        lastmod: ts ? String(ts).slice(0, 10) : undefined,
      }
    })
  )
  return entries.sort((a, b) => a.path.localeCompare(b.path))
}

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Returns `xml` with its /wiki/... entries replaced by `entries`. Every other
 * URL (the section pages, /wiki itself) is kept in its original order.
 */
export function mergeSitemap(xml, entries) {
  const kept = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1])
    .filter((loc) => !loc.startsWith(`${SITE}/wiki/`))

  const lines = [
    ...kept.map((loc) => `    <url><loc>${loc}</loc></url>`),
    ...entries.map(
      ({ path: p, lastmod }) =>
        `    <url><loc>${escapeXml(SITE + p)}</loc>${
          lastmod ? `<lastmod>${lastmod}</lastmod>` : ''
        }</url>`
    ),
  ]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Section pages of teia.art, plus the wiki pages read from the wiki',
    '     contract when this build was made (scripts/wiki-sitemap.mjs). -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...lines,
    '</urlset>',
    '',
  ].join('\n')
}

async function main() {
  const file = path.join(ROOT, 'build', 'sitemap.xml')
  try {
    const constants = await readFile(
      path.join(ROOT, 'src', 'constants.ts'),
      'utf8'
    )
    const contract = constants.match(/WIKI_CONTRACT\s*=\s*'(KT1\w+)'/)?.[1]
    if (!contract) throw new Error('WIKI_CONTRACT not found in constants.ts')

    const proxy =
      process.env.VITE_IPFS_MSG_UPLOAD_PROXY || 'https://ipfsmsg.teia.art'
    const entries = await fetchWikiEntries({
      tzkt: process.env.VITE_TZKT_API || 'https://api.tzkt.io',
      contract,
      gateways: [
        `${proxy}/ipfs/`,
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
      ],
    })
    if (entries.length === 0) throw new Error('the wiki has no visible pages')

    await writeFile(file, mergeSitemap(await readFile(file, 'utf8'), entries))
    console.log(`wiki sitemap: listed ${entries.length} wiki pages`)
  } catch (err) {
    console.warn(
      `wiki sitemap: kept the committed list (${err?.message || err})`
    )
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main()
}
