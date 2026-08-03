#!/usr/bin/env node
/**
 * Regenerates src/data/stats-history.json — per-year Teia/HEN sales, volume and
 * collector counts for /dao/stats.
 *
 * Do run:
 *   npm run build:stats-history
 *
 * roughly once a year.
 * This is a performance cache, not a source of truth: the UI live-queries any year missing from it. It exists because the
 * 2021-22 buckets take 20-55s cold on teztok's `events` table; those years are
 * baked in now and never change. Mints and artists come from `tokens` and are
 * queried live, so they are not in this file.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ENDPOINT =
  process.env.VITE_TEIA_GRAPHQL_API || 'https://teztok.teia.rocks/v1/graphql'

const FIRST_YEAR = 2021
/** Keep in sync with TEIA_SALE_TYPES in src/data/platform-stats.ts. */
const TEIA_SALE_TYPES = '["TEIA_COLLECT", "HEN_COLLECT", "HEN_COLLECT_V2"]'

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'stats-history.json'
)

/**
 * Known-good values, verified against the endpoint on 2026-08-03. A mismatch
 * means either the indexer changed or a query regressed — fail loudly rather
 * than committing quietly wrong numbers.
 */
const EXPECTED = {
  2021: { collectors: 53834, sales: 3821525, volumeTez: 10766736 },
  2022: { collectors: 36258, sales: 1039649, volumeTez: 2135337 },
  2023: { collectors: 10177, sales: 128726, volumeTez: 543941 },
  2024: { collectors: 4580, sales: 46186, volumeTez: 171055 },
  2025: { collectors: 3029, sales: 43662, volumeTez: 296996 },
}

async function gql(query, { retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.errors) throw new Error(JSON.stringify(json.errors))
      return json.data
    } catch (err) {
      if (attempt === retries) throw err
      console.warn(`  retry ${attempt}/${retries - 1}: ${err.message}`)
      await new Promise((r) => setTimeout(r, 3000 * attempt))
    }
  }
  return null
}

const saleWhere = (year) =>
  `where: { implements: { _eq: "SALE" }, type: { _in: ${TEIA_SALE_TYPES} }, ` +
  `timestamp: { _gte: "${year}-01-01", _lt: "${year + 1}-01-01" } }`

async function fetchYear(year) {
  // Kept as two sequential requests on purpose: batching several slow
  // aggregates into one document makes this endpoint time out.
  const sales = await gql(
    `{ events_aggregate(${saleWhere(year)}) { aggregate { count sum { price } } } }`
  )
  const collectors = await gql(
    `{ events_aggregate(${saleWhere(year)}) { aggregate { count(columns: [buyer_address], distinct: true) } } }`
  )
  return {
    collectors: collectors.events_aggregate.aggregate.count,
    sales: sales.events_aggregate.aggregate.count,
    volumeMutez: Number(sales.events_aggregate.aggregate.sum.price ?? 0),
  }
}

async function main() {
  const boundary = new Date().getUTCFullYear()
  const years = []
  for (let y = FIRST_YEAR; y < boundary; y += 1) years.push(y)

  console.log(`Endpoint: ${ENDPOINT}`)
  console.log(`Completed years to fetch: ${years.join(', ')}`)
  console.log('The 2021-22 buckets take 20-55s each. This is expected.\n')

  const out = {}
  const mismatches = []

  for (const year of years) {
    const started = Date.now()
    const row = await fetchYear(year)
    out[year] = row

    const volumeTez = Math.round(row.volumeMutez / 1e6)
    console.log(
      `${year}  collectors=${row.collectors.toLocaleString()}  ` +
        `sales=${row.sales.toLocaleString()}  ` +
        `volume=${volumeTez.toLocaleString()} tez  ` +
        `(${((Date.now() - started) / 1000).toFixed(0)}s)`
    )

    const want = EXPECTED[year]
    if (want) {
      // Sales and volume only ever grow for a completed year if the indexer
      // backfills; collectors likewise. Any shrink is a real problem.
      if (row.collectors < want.collectors || row.sales < want.sales) {
        mismatches.push(
          `${year}: got ${row.sales} sales / ${row.collectors} collectors, ` +
            `expected at least ${want.sales} / ${want.collectors}`
        )
      }
      if (volumeTez < want.volumeTez * 0.99) {
        mismatches.push(
          `${year}: volume ${volumeTez} tez is below the expected ${want.volumeTez} tez`
        )
      }
    }
  }

  if (mismatches.length) {
    console.error('\nSanity checks failed:')
    for (const m of mismatches) console.error(`  - ${m}`)
    console.error('\nRefusing to write stats-history.json.')
    process.exit(1)
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    note: 'Teia + HEN sales only (objkt excluded). Performance cache — the UI live-queries any year missing here, so regenerating is optional.',
    years: out,
  }

  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(`\nWrote ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
