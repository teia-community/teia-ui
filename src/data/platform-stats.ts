/**
 * Platform stats for the DAO Stats page: mints, artists, collectors, sales and
 * volume per year.
 *
 * Two sources, split by how fast teztok answers:
 *
 * - `tokens` (mints, artists) is sub-second even for the busy 2021 era, and all
 *   years come back in one batched request, so it is queried live.
 * - `events` (collectors, sales, volume) is 20-55s cold for 2021-22, so
 *   completed years are precomputed into `stats-history.json`. Only years
 *   missing from that file are queried live — normally just the current one.
 *
 * `usePlatformTable()` is the only entry point; it merges both sources.
 */
import useSWR from 'swr'
import { request } from 'graphql-request'

const ENDPOINT = import.meta.env.VITE_TEIA_GRAPHQL_API

/** Teia/HEN's first mints. Verified: no tokens or sales exist before this. */
const FIRST_YEAR = 2021

/**
 * Teia teztok types
 */
const TEIA_SALE_TYPES = '["TEIA_COLLECT", "HEN_COLLECT", "HEN_COLLECT_V2"]'

interface MarketYear {
  collectors: number
  sales: number
  volumeMutez: number
}

interface YearRow extends Partial<MarketYear> {
  year: number
  mints: number
  artists: number
  /** True for the current, incomplete year — render as "YTD". */
  partial: boolean
}

/** Every aggregate we ask for returns a count; only the sales ones add a sum. */
type Agg = { aggregate: { count: number; sum?: { price: number | null } } }

const yearBounds = (y: number) => ({ from: `${y}-01-01`, to: `${y + 1}-01-01` })

function platformYears(): number[] {
  const years: number[] = []
  for (let y = FIRST_YEAR; y <= new Date().getUTCFullYear(); y += 1) years.push(y)
  return years
}

// --- Mints + artists (live, `tokens`) --------------------------------------

function buildTokensQuery(years: number[]): string {
  const parts = [
    'total_mints: tokens_aggregate { aggregate { count } }',
    'total_artists: tokens_aggregate { aggregate { count(columns: [artist_address], distinct: true) } }',
  ]
  for (const y of years) {
    const { from, to } = yearBounds(y)
    const where = `where: { minted_at: { _gte: "${from}", _lt: "${to}" } }`
    parts.push(`m${y}: tokens_aggregate(${where}) { aggregate { count } }`)
    parts.push(
      `a${y}: tokens_aggregate(${where}) { aggregate { count(columns: [artist_address], distinct: true) } }`
    )
  }
  return `query PlatformStats {\n  ${parts.join('\n  ')}\n}`
}

interface PlatformStats {
  totalMints: number
  totalArtists: number
  years: YearRow[]
}

function usePlatformStats() {
  const years = platformYears()
  const currentYear = years[years.length - 1]

  return useSWR<PlatformStats>(
    `stats:platform:${FIRST_YEAR}-${currentYear}`,
    async () => {
      const res = await request<Record<string, Agg>>(
        ENDPOINT,
        buildTokensQuery(years)
      )
      return {
        totalMints: res.total_mints.aggregate.count,
        totalArtists: res.total_artists.aggregate.count,
        years: years.map((year) => ({
          year,
          mints: res[`m${year}`].aggregate.count,
          artists: res[`a${year}`].aggregate.count,
          partial: year === currentYear,
        })),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )
}

// --- Collectors + sales + volume (live, `events`) --------------------------

function buildMarketQuery(years: number[]): string {
  const parts: string[] = []
  for (const y of years) {
    const { from, to } = yearBounds(y)
    const where = `where: { implements: { _eq: "SALE" }, type: { _in: ${TEIA_SALE_TYPES} }, timestamp: { _gte: "${from}", _lt: "${to}" } }`
    parts.push(
      `s${y}: events_aggregate(${where}) { aggregate { count sum { price } } }`
    )
    parts.push(
      `c${y}: events_aggregate(${where}) { aggregate { count(columns: [buyer_address], distinct: true) } }`
    )
  }
  return `query MarketStats {\n  ${parts.join('\n  ')}\n}`
}

function useMarketStats(years: number[]) {
  return useSWR<Record<number, MarketYear>>(
    years.length ? `stats:market:${years.join(',')}` : null,
    async () => {
      const res = await request<Record<string, Agg>>(
        ENDPOINT,
        buildMarketQuery(years)
      )
      const out: Record<number, MarketYear> = {}
      for (const y of years) {
        const sales = res[`s${y}`].aggregate
        out[y] = {
          sales: sales.count,
          volumeMutez: Number(sales.sum?.price ?? 0),
          collectors: res[`c${y}`].aggregate.count,
        }
      }
      return out
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )
}

// --- Precomputed history ---------------------------------------------------

/** Only the part of stats-history.json we read; the file also carries a note. */
interface StatsHistory {
  years: Record<string, MarketYear>
}

function useStatsHistory() {
  return useSWR<StatsHistory>(
    'stats:history',
    () =>
      import('./stats-history.json').then(
        (m) => m.default as unknown as StatsHistory
      ),
    { revalidateOnFocus: false, revalidateIfStale: false }
  )
}

// --- Public entry point ----------------------------------------------------

export function usePlatformTable() {
  const { data: platform, error } = usePlatformStats()
  const { data: history } = useStatsHistory()

  // Wait for the history file before deciding what is missing. Treating an
  // unloaded history as "nothing cached" would live-query the slow 2021-22
  // years, turning a 2s load into minutes.
  const pending =
    platform && history
      ? platform.years.map((y) => y.year).filter((y) => !history.years[y])
      : []

  const { data: live } = useMarketStats(pending)

  const rows: YearRow[] = (platform?.years ?? []).map((row) => ({
    ...row,
    ...(history?.years[row.year] ?? live?.[row.year]),
  }))

  // Year rows sum to the all-time figure, but only once every year has landed.
  const complete = rows.length > 0 && rows.every((r) => r.sales != null)
  const sum = (pick: (r: YearRow) => number | undefined) =>
    complete ? rows.reduce((n, r) => n + (pick(r) ?? 0), 0) : undefined

  return {
    rows,
    totals: {
      mints: platform?.totalMints,
      artists: platform?.totalArtists,
      sales: sum((r) => r.sales),
      volumeMutez: sum((r) => r.volumeMutez),
    },
    error,
    isLoading: !platform && !error,
  }
}
