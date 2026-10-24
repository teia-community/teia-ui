// What the chain says about trading and minting on Teia.
//
// The indexer counts rows between two timestamps but cannot group by week, so
// each chart week is its own aliased aggregate and the whole chart arrives in
// a single request. The totals use the same window as the chart, so a card
// and the curve under it are always talking about the same period.

import useSWR from 'swr'
import { fetchGraphQL } from './api'
import { weekBuckets, tezFromMutez } from '@utils/stats-weeks.mjs'

/** Six months: long enough to show a season, short enough to stay quick. */
export const WEEKS = 26

/** Where a sale happened, by the event the indexer recorded. */
const VENUES = [
  { key: 'teia', label: 'Teia', match: '{ _in: ["TEIA_COLLECT"] }' },
  {
    key: 'hen',
    label: 'hic et nunc',
    match: '{ _in: ["HEN_COLLECT", "HEN_COLLECT_V2"] }',
  },
  { key: 'objkt', label: 'objkt.com', match: '{ _like: "OBJKT%" }' },
]

interface Bucket {
  week: string
  count: number
  volume: number
}

interface Totals {
  count: number
  volume: number
  topPrice: number
  buyers: number
}

export interface SalesStats {
  totals: Totals
  allTime: number
  weekly: Bucket[]
  venues: { key: string; label: string; count: number; volume: number }[]
}

export interface MintStats {
  minted: number
  editions: number
  artists: number
  allTime: number
  weekly: { week: string; count: number }[]
}

export interface MarketplaceStats {
  listed: number
  cancelled: number
  collected: number
  collaborations: number
  weekly: { week: string; listed: number; collected: number }[]
}

/** `aggregate { count }` for rows of `type` between two timestamps. */
function countAlias(
  alias: string,
  where: string,
  extra = ''
): string {
  return `${alias}: events_aggregate(where: {${where}}) { aggregate { count ${extra} } }`
}

const since = (from: string, to: string) =>
  `timestamp: {_gte: "${from}", _lt: "${to}"}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function agg(data: any, alias: string) {
  return data?.[alias]?.aggregate ?? {}
}

async function run(query: string, name: string) {
  const { data, errors } = await fetchGraphQL(query, name, {})
  if (errors?.length) throw new Error(errors[0].message)
  if (!data) throw new Error('The indexer returned nothing.')
  return data
}

/** Sales of Teia-indexed tokens, wherever they were sold. */
export function useSalesStats() {
  return useSWR<SalesStats>(
    'stats:sales',
    async () => {
      const weeks = weekBuckets(WEEKS)
      const window = `timestamp: {_gte: "${weeks[0].from}"}`
      const sale = 'implements: {_eq: "SALE"}'

      const query = `query salesStats {
        ${countAlias(
          'totals',
          `${sale}, ${window}`,
          'sum { price } max { price } count_buyers: count(columns: buyer_address, distinct: true)'
        )}
        ${countAlias('allTime', sale)}
        ${VENUES.map((v) =>
          countAlias(
            v.key,
            `${sale}, ${window}, type: ${v.match}`,
            'sum { price }'
          )
        ).join('\n')}
        ${weeks
          .map((w, i) =>
            countAlias(`w${i}`, `${sale}, ${since(w.from, w.to)}`, 'sum { price }')
          )
          .join('\n')}
      }`

      const data = await run(query, 'salesStats')
      const totals = agg(data, 'totals')

      return {
        totals: {
          count: Number(totals.count ?? 0),
          volume: tezFromMutez(totals.sum?.price),
          topPrice: tezFromMutez(totals.max?.price),
          // Hasura names a second count by its alias inside the aggregate.
          buyers: Number(totals.count_buyers ?? 0),
        },
        allTime: Number(agg(data, 'allTime').count ?? 0),
        venues: VENUES.map((v) => ({
          key: v.key,
          label: v.label,
          count: Number(agg(data, v.key).count ?? 0),
          volume: tezFromMutez(agg(data, v.key).sum?.price),
        })),
        weekly: weeks.map((w, i) => ({
          week: w.week,
          count: Number(agg(data, `w${i}`).count ?? 0),
          volume: Math.round(tezFromMutez(agg(data, `w${i}`).sum?.price)),
        })),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )
}

/** Minting on the Teia (hic et nunc) FA2. */
export function useMintStats() {
  return useSWR<MintStats>(
    'stats:mints',
    async () => {
      const weeks = weekBuckets(WEEKS)
      const window = `timestamp: {_gte: "${weeks[0].from}"}`
      const mint = 'type: {_eq: "HEN_MINT"}'

      const query = `query mintStats {
        ${countAlias(
          'totals',
          `${mint}, ${window}`,
          'sum { editions } count_artists: count(columns: artist_address, distinct: true)'
        )}
        ${countAlias('allTime', mint)}
        ${weeks
          .map((w, i) => countAlias(`w${i}`, `${mint}, ${since(w.from, w.to)}`))
          .join('\n')}
      }`

      const data = await run(query, 'mintStats')
      const totals = agg(data, 'totals')

      return {
        minted: Number(totals.count ?? 0),
        editions: Number(totals.sum?.editions ?? 0),
        artists: Number(totals.count_artists ?? 0),
        allTime: Number(agg(data, 'allTime').count ?? 0),
        weekly: weeks.map((w, i) => ({
          week: w.week,
          count: Number(agg(data, `w${i}`).count ?? 0),
        })),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )
}

/** What happens on Teia's own marketplace contract. */
export function useMarketplaceStats() {
  return useSWR<MarketplaceStats>(
    'stats:marketplace',
    async () => {
      const weeks = weekBuckets(WEEKS)
      const window = `timestamp: {_gte: "${weeks[0].from}"}`

      const query = `query marketplaceStats {
        ${countAlias('listed', `type: {_eq: "TEIA_SWAP"}, ${window}`)}
        ${countAlias(
          'cancelled',
          `type: {_eq: "TEIA_CANCEL_SWAP"}, ${window}`
        )}
        ${countAlias('collected', `type: {_eq: "TEIA_COLLECT"}, ${window}`)}
        ${countAlias(
          'collaborations',
          `type: {_eq: "TEIA_SPLIT_CONTRACT_ORIGINATION"}, ${window}`
        )}
        ${weeks
          .map(
            (w, i) => `
            l${i}: events_aggregate(where: {type: {_eq: "TEIA_SWAP"}, ${since(
              w.from,
              w.to
            )}}) { aggregate { count } }
            c${i}: events_aggregate(where: {type: {_eq: "TEIA_COLLECT"}, ${since(
              w.from,
              w.to
            )}}) { aggregate { count } }`
          )
          .join('\n')}
      }`

      const data = await run(query, 'marketplaceStats')

      return {
        listed: Number(agg(data, 'listed').count ?? 0),
        cancelled: Number(agg(data, 'cancelled').count ?? 0),
        collected: Number(agg(data, 'collected').count ?? 0),
        collaborations: Number(agg(data, 'collaborations').count ?? 0),
        weekly: weeks.map((w, i) => ({
          week: w.week,
          listed: Number(agg(data, `l${i}`).count ?? 0),
          collected: Number(agg(data, `c${i}`).count ?? 0),
        })),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )
}
