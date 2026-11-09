#!/usr/bin/env node
// Regenerates src/data/tag-vocabulary.json, the list of tags Teia already uses.
//
// The mint and text-post forms suggest tags from this list, so a suggestion is
// always a tag that leads somewhere (a tag page with other work in it) and
// people stop inventing five spellings of the same thing. It is a committed
// snapshot, not a runtime fetch: the app never calls the indexer for this.
//
// Run it by hand now and then (`node scripts/tag-vocabulary.mjs`) to pick up
// newly popular tags. Nothing in the build depends on it.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API = process.env.VITE_TEIA_GRAPHQL_API || 'https://teztok.teia.rocks/v1/graphql'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src', 'data', 'tag-vocabulary.json')

/** How many of the most recent tag rows to count. */
const SAMPLE = Number(process.env.TAG_SAMPLE || 100_000)
const PAGE = 10_000 // the indexer caps a page at 10k rows
/** Keep a tag only once it has been used this many times in the sample. */
const MIN_USES = 3
/** Cap on the committed list, most used first. */
const MAX_TAGS = 2000

const QUERY = `query TagSample($limit: Int!, $offset: Int!) {
  tags(limit: $limit, offset: $offset, order_by: { token_id: desc }) {
    tag
  }
}`

/** Tags worth suggesting: short, single-token, not a bare number. */
function isUsable(tag) {
  return (
    typeof tag === 'string' &&
    /^[a-z0-9][a-z0-9-]{1,29}$/.test(tag) &&
    !/^\d+$/.test(tag)
  )
}

async function fetchPage(offset) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { limit: PAGE, offset } }),
  })
  if (!res.ok) throw new Error(`Indexer error: ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message || 'query failed')
  return json.data.tags
}

async function main() {
  const counts = new Map()
  let seen = 0

  for (let offset = 0; offset < SAMPLE; offset += PAGE) {
    const rows = await fetchPage(offset)
    for (const { tag } of rows) {
      seen++
      const clean = String(tag || '').trim().toLowerCase()
      if (!isUsable(clean)) continue
      counts.set(clean, (counts.get(clean) || 0) + 1)
    }
    process.stdout.write(`  sampled ${seen} tag rows\r`)
    if (rows.length < PAGE) break
  }

  const tags = [...counts.entries()]
    .filter(([, n]) => n >= MIN_USES)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_TAGS)

  await writeFile(
    OUT,
    JSON.stringify(
      {
        generated: new Date().toISOString().slice(0, 10),
        sampled: seen,
        // [tag, uses] so suggestions can rank by how established a tag is.
        tags,
      },
      null,
      0
    ) + '\n'
  )

  console.log(`\n${tags.length} tags from ${seen} rows -> ${path.relative(ROOT, OUT)}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
