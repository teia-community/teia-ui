/**
 * Weekly primary vs secondary sales for the DAO Stats page.
 */
import { useRef } from 'react'
import useSWR from 'swr'
import { gql } from 'graphql-request'
import { fetchAll } from './teztok-paginate'
import { TEIA_SALE_TYPES } from './platform-stats'
import { weekStartISO } from './messaging/stats'

const PAGE_SIZE = 10000

/** Longest selectable window */
export const MAX_DAYS = 180

// Strict total order for keyset paging: level+opid is the on-chain ordering,
const SALES_CURSOR = ['level', 'opid', 'id']

export interface SaleEvent {
  id: string
  level: number
  opid: number
  timestamp: string
  price: string | number | null
  seller_address: string | null
  token: { artist_address: string | null } | null
}

export interface SalesWeek {
  week: string
  primaryVolume: number
  secondaryVolume: number
  primaryCount: number
  secondaryCount: number
}

export interface SalesStats {
  weekly: SalesWeek[]
  totalCount: number
  totalVolume: number
  primaryCount: number
  primaryVolume: number
  secondaryCount: number
  secondaryVolume: number
}

const SALES_QUERY = gql`
  query Sales($where: events_bool_exp!, $limit: Int!) {
    events(
      where: $where
      order_by: [{ level: asc }, { opid: asc }, { id: asc }]
      limit: $limit
    ) {
      id
      level
      opid
      timestamp
      price
      seller_address
      token {
        artist_address
      }
    }
  }
`

const daysAgoISO = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

export function useSalesEvents({
  onProgress,
}: { onProgress?: (count: number) => void } = {}) {
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  return useSWR<SaleEvent[]>(
    `stats:sales:teia:${MAX_DAYS}d`,
    () =>
      fetchAll(
        SALES_QUERY,
        'events',
        {
          implements: { _eq: 'SALE' },
          type: { _in: TEIA_SALE_TYPES },
          timestamp: { _gte: daysAgoISO(MAX_DAYS) },
        },
        SALES_CURSOR,
        {
          pageSize: PAGE_SIZE,
          onProgress: (n: number) => onProgressRef.current?.(n),
        }
      ),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    }
  )
}

/** Primary = the seller is the token's artist, matching the activity feed. */
export function marketOf(e: SaleEvent): 'primary' | 'secondary' {
  const artist = e.token?.artist_address
  return artist && e.seller_address === artist ? 'primary' : 'secondary'
}

const emptyWeek = (week: string): SalesWeek => ({
  week,
  primaryVolume: 0,
  secondaryVolume: 0,
  primaryCount: 0,
  secondaryCount: 0,
})

// The in-progress week is dropped so the charts end on the last complete week, otherwise the chart goes down lol
function fillWeekGaps(
  byWeek: Map<string, SalesWeek>,
  since: string
): SalesWeek[] {
  const end = new Date(weekStartISO(new Date().toISOString()))
  const weeks: SalesWeek[] = []
  for (
    let cursor = new Date(weekStartISO(since));
    cursor < end;
    cursor.setUTCDate(cursor.getUTCDate() + 7)
  ) {
    const week = cursor.toISOString().slice(0, 10)
    weeks.push(byWeek.get(week) ?? emptyWeek(week))
  }
  return weeks
}

export function aggregateSales(
  events: SaleEvent[],
  { since }: { since: string }
): SalesStats {
  const sinceMs = new Date(since).getTime()
  const byWeek = new Map<string, SalesWeek>()
  let primaryCount = 0
  let primaryVolume = 0
  let secondaryCount = 0
  let secondaryVolume = 0
  let totalCount = 0

  for (const e of events) {
    if (new Date(e.timestamp).getTime() < sinceMs) continue
    totalCount += 1

    const tez = Number(e.price ?? 0) / 1e6
    const week = weekStartISO(e.timestamp)
    const row = byWeek.get(week) ?? emptyWeek(week)

    if (marketOf(e) === 'primary') {
      row.primaryVolume += tez
      row.primaryCount += 1
      primaryVolume += tez
      primaryCount += 1
    } else {
      row.secondaryVolume += tez
      row.secondaryCount += 1
      secondaryVolume += tez
      secondaryCount += 1
    }
    byWeek.set(week, row)
  }

  const weekly = fillWeekGaps(byWeek, since).map((row) => ({
    ...row,
    primaryVolume: Math.round(row.primaryVolume),
    secondaryVolume: Math.round(row.secondaryVolume),
  }))

  return {
    weekly,
    totalCount,
    totalVolume: Math.round(primaryVolume + secondaryVolume),
    primaryCount,
    primaryVolume: Math.round(primaryVolume),
    secondaryCount,
    secondaryVolume: Math.round(secondaryVolume),
  }
}
