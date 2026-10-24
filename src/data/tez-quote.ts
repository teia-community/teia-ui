// What a tez is worth, for reading treasury amounts in money people use.
//
// A proposal moving 24,209 tez means little without a second figure beside
// it. The indexer already publishes the rate, so no other service is needed.
// The rate can also be set by hand: a vote taken last month should be read at
// the rate that applied then, not today's.

import useSWR from 'swr'

import { tzktFetch } from './tzkt'

const TZKT_API = import.meta.env.VITE_TZKT_API

/** The currencies the indexer quotes. */
export const CURRENCIES = [
  { key: 'usd', label: 'USD', symbol: '$' },
  { key: 'eur', label: 'EUR', symbol: '€' },
  { key: 'gbp', label: 'GBP', symbol: '£' },
  { key: 'jpy', label: 'JPY', symbol: '¥' },
  { key: 'cny', label: 'CNY', symbol: 'CN¥' },
  { key: 'krw', label: 'KRW', symbol: '₩' },
  { key: 'btc', label: 'BTC', symbol: '₿' },
  { key: 'eth', label: 'ETH', symbol: 'Ξ' },
]

export function currencyOf(key: string) {
  return CURRENCIES.find((c) => c.key === key) ?? CURRENCIES[0]
}

export interface TezQuote {
  rates: Record<string, number>
  timestamp: string | null
}

/** The latest published rate for one tez. */
export function useTezQuote() {
  const { data, error } = useSWR<TezQuote>(
    'tez:quote',
    async () => {
      const row = await tzktFetch<
        Record<string, number> & { timestamp?: string }
      >(`${TZKT_API}/v1/quotes/last`)
      const rates: Record<string, number> = {}
      for (const { key } of CURRENCIES) {
        const value = Number(row?.[key])
        if (Number.isFinite(value)) rates[key] = value
      }
      return { rates, timestamp: row?.timestamp ?? null }
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )

  return { quote: data, error, isLoading: !data && !error }
}

/**
 * Tez written in another currency.
 *
 * Crypto rates are tiny per unit, so they keep more places than money does.
 */
export function formatConverted(tez: number, rate: number, currencyKey: string) {
  if (!Number.isFinite(tez) || !Number.isFinite(rate)) return null
  const currency = currencyOf(currencyKey)
  const value = tez * rate
  const isCrypto = currencyKey === 'btc' || currencyKey === 'eth'
  return `${currency.symbol}${value.toLocaleString(undefined, {
    maximumFractionDigits: isCrypto ? 6 : 2,
  })}`
}

export default useTezQuote
