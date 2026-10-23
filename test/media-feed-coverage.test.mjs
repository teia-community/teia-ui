// Every format the site accepts at mint should have a feed to appear in.
//
// The feed lists and the mint list were written separately and drifted for
// years: FLAC, QuickTime, WebM, WebP and BMP were all mintable, all rendered
// fine, and appeared in no feed at all. This reads the constants as source so
// the two cannot part company again without a test failing.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/constants.ts', 'utf8')

/** Pulls `KEY: 'value',` pairs out of the MIMETYPE map. */
function readMimetypes() {
  const block = source.match(/export const MIMETYPE[^{]*\{([\s\S]*?)\n\}/)
  assert.ok(block, 'MIMETYPE map not found in constants.ts')
  const entries = [...block[1].matchAll(/(\w+):\s*'([^']+)'/g)]
  assert.ok(entries.length > 0, 'MIMETYPE map parsed as empty')
  return new Map(entries.map((m) => [m[1], m[2]]))
}

/**
 * Pulls the MIMETYPE.KEY references out of a named export, whether it is
 * written as a one-line array or a nested object spread over many lines.
 */
function readKeysFrom(name) {
  const start = source.indexOf(`export const ${name}`)
  assert.ok(start >= 0, `${name} not found in constants.ts`)
  const open = source.slice(start).search(/[[{]/)
  assert.ok(open >= 0, `${name} has no list or object body`)

  let depth = 0
  let end = -1
  for (let i = start + open; i < source.length; i += 1) {
    const c = source[i]
    if (c === '[' || c === '{') depth += 1
    else if (c === ']' || c === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  assert.ok(end > 0, `${name} body is unbalanced`)

  const body = source.slice(start + open, end + 1)
  return [...body.matchAll(/MIMETYPE\.(\w+)/g)].map((m) => m[1])
}

test('every mintable format is in a feed or named as undisplayable', () => {
  const mimetypes = readMimetypes()
  const inFeeds = readKeysFrom('FEED_MIMETYPES')
  const undisplayable = readKeysFrom('UNDISPLAYABLE_MIMETYPES')
  const accounted = new Set([...inFeeds, ...undisplayable])

  const orphans = [...mimetypes.keys()].filter((key) => !accounted.has(key))
  assert.deepEqual(
    orphans,
    [],
    `these formats can be minted but have no feed: ${orphans
      .map((k) => mimetypes.get(k))
      .join(', ')}`
  )
})

test('no format is claimed by two different feeds', () => {
  const inFeeds = readKeysFrom('FEED_MIMETYPES')
  const seen = new Set()
  const duplicates = inFeeds.filter((key) => !seen.add(key) && true)
  assert.deepEqual(duplicates, [], `listed in more than one feed: ${duplicates}`)
})

test('a feed never lists something that cannot be displayed', () => {
  const inFeeds = new Set(readKeysFrom('FEED_MIMETYPES'))
  const clashes = readKeysFrom('UNDISPLAYABLE_MIMETYPES').filter((key) =>
    inFeeds.has(key)
  )
  assert.deepEqual(clashes, [], `undisplayable but in a feed: ${clashes}`)
})

test('every feed group references real MIMETYPE keys', () => {
  const mimetypes = readMimetypes()
  const unknown = readKeysFrom('FEED_MIMETYPES').filter(
    (key) => !mimetypes.has(key)
  )
  assert.deepEqual(unknown, [], `not keys of MIMETYPE: ${unknown}`)
})
