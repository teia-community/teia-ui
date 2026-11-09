import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  fetchWikiEntries,
  mergeSitemap,
  slugify,
  wikiPath,
} from '../scripts/wiki-sitemap.mjs'

const json = (body) => ({ ok: true, json: async () => body })

// A fake network: two visible pages, one hidden page.
function fakeFetch({ failCid } = {}) {
  return async (url) => {
    if (url.includes('/bigmaps/pages/')) {
      return json([
        {
          key: '1',
          value: { current_cid: 'cidA', hidden: false, version_count: '2' },
        },
        {
          key: '2',
          value: { current_cid: 'cidB', hidden: true, version_count: '1' },
        },
        {
          key: '3',
          value: { current_cid: 'cidC', hidden: false, version_count: '1' },
        },
      ])
    }
    if (url.includes('/bigmaps/versions/')) {
      return json([
        {
          key: { page_id: '1', version: '1' },
          value: { ts: '2026-08-01T10:00:00Z' },
        },
        {
          key: { page_id: '1', version: '2' },
          value: { ts: '2026-09-15T12:30:00Z' },
        },
        {
          key: { page_id: '3', version: '1' },
          value: { ts: '2026-07-04T08:00:00Z' },
        },
      ])
    }
    const cid = url.split('/').pop()
    if (cid === failCid) return { ok: false, status: 504 }
    return json(
      {
        cidA: { title: 'TEIA Events', slug: 'events' },
        cidB: { title: 'Secret Draft', slug: 'secret' },
        cidC: { title: '', slug: 'old-slug' },
      }[cid]
    )
  }
}

const options = (fetchImpl) => ({
  tzkt: 'https://tzkt.test',
  contract: 'KT1test',
  gateways: ['https://gw.test/ipfs/'],
  fetchImpl,
})

test('slugify matches the wiki URL rule', () => {
  assert.equal(
    slugify('History of TEIA (And Hic et Nunc)'),
    'history-of-teia-and-hic-et-nunc'
  )
  assert.equal(
    slugify('  TEIA Wiki [Guide to Getting Started] '),
    'teia-wiki-guide-to-getting-started'
  )
})

test('wikiPath prefers the title slug, then the stored slug, then the id', () => {
  assert.equal(
    wikiPath({ title: 'TEIA Events', slug: 'events' }, '1'),
    '/wiki/teia-events'
  )
  assert.equal(wikiPath({ title: '', slug: 'old-slug' }, '3'), '/wiki/old-slug')
  assert.equal(wikiPath({}, '7'), '/wiki/7')
})

test('fetchWikiEntries lists visible pages with their last edit date', async () => {
  const entries = await fetchWikiEntries(options(fakeFetch()))
  assert.deepEqual(entries, [
    { path: '/wiki/old-slug', lastmod: '2026-07-04' },
    { path: '/wiki/teia-events', lastmod: '2026-09-15' },
  ])
})

test('fetchWikiEntries never reads or lists a hidden page', async () => {
  const seen = []
  const inner = fakeFetch()
  await fetchWikiEntries(options(async (url) => (seen.push(url), inner(url))))
  assert.ok(!seen.some((u) => u.endsWith('cidB')))
})

test('fetchWikiEntries throws rather than return a partial list', async () => {
  await assert.rejects(
    fetchWikiEntries(options(fakeFetch({ failCid: 'cidC' })))
  )
})

test('mergeSitemap replaces wiki pages and keeps every other URL', () => {
  const before = `<urlset>
    <url><loc>https://teia.art</loc></url>
    <url><loc>https://teia.art/wiki</loc></url>
    <url><loc>https://teia.art/wiki/renamed-away</loc></url>
    <url><loc>https://teia.art/polls</loc></url>
</urlset>`
  const after = mergeSitemap(before, [
    { path: '/wiki/teia-events', lastmod: '2026-09-15' },
    { path: '/wiki/7' },
  ])
  const locs = [...after.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  assert.deepEqual(locs, [
    'https://teia.art',
    'https://teia.art/wiki',
    'https://teia.art/polls',
    'https://teia.art/wiki/teia-events',
    'https://teia.art/wiki/7',
  ])
  assert.match(after, /teia-events<\/loc><lastmod>2026-09-15<\/lastmod>/)
  assert.match(after, /^<\?xml version="1.0"/)
})
