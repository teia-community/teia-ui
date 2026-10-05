import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SITE_URL,
  canonicalUrl,
  pageTitle,
  summarize,
} from '../src/utils/page-meta.mjs'

test('pageTitle appends the site name, or falls back to it', () => {
  assert.equal(pageTitle('Teia Wiki'), 'Teia Wiki - teia')
  assert.equal(pageTitle(''), 'teia')
  assert.equal(pageTitle(undefined), 'teia')
})

test('canonicalUrl drops query, hash, trailing and doubled slashes', () => {
  assert.equal(canonicalUrl('/'), SITE_URL)
  assert.equal(canonicalUrl(''), SITE_URL)
  assert.equal(canonicalUrl('/wiki/'), `${SITE_URL}/wiki`)
  assert.equal(
    canonicalUrl('/wiki/teia-events?x=1#top'),
    `${SITE_URL}/wiki/teia-events`
  )
  assert.equal(canonicalUrl('//objkt//1'), `${SITE_URL}/objkt/1`)
})

test('summarize turns markdown into plain text', () => {
  const md = [
    '# History of TEIA',
    '',
    'Teia began as a **community fork** of [hic et nunc](https://hicetnunc.xyz).',
    '',
    '![logo](ipfs://abc)',
    '- first point',
    '1. numbered point',
    '> quoted',
    '```js',
    'const hidden = true',
    '```',
    '<div>inline html</div>',
  ].join('\n')
  assert.equal(
    summarize(md, 500),
    'History of TEIA Teia began as a community fork of hic et nunc. first point numbered point quoted inline html'
  )
})

test('summarize cuts long text at a word boundary with an ellipsis', () => {
  const out = summarize('word '.repeat(100), 50)
  assert.ok(out.length <= 50)
  assert.ok(out.endsWith('word…'))
})

test('summarize handles empty input and short text', () => {
  assert.equal(summarize(''), '')
  assert.equal(summarize(undefined), '')
  assert.equal(summarize('Short page.'), 'Short page.')
})
