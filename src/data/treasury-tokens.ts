// What the treasury actually holds, so a transfer proposal offers real
// choices instead of asking someone to paste a contract address.

import useSWR from 'swr'
import { DAO_TREASURY_CONTRACT } from '@constants'

const TZKT_API = import.meta.env.VITE_TZKT_API

export interface TreasuryToken {
  contract: string
  tokenId: string
  symbol: string
  decimals: number
  /** Smallest unit, as the contract holds it. */
  rawBalance: number
}

export function useTreasuryTokens() {
  const { data, error } = useSWR<TreasuryToken[]>(
    'treasury:tokens',
    async () => {
      const url = new URL(`${TZKT_API}/v1/tokens/balances`)
      url.searchParams.set('account', DAO_TREASURY_CONTRACT)
      url.searchParams.set('balance.gt', '0')
      url.searchParams.set('limit', '200')
      url.searchParams.set('select', 'token,balance')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
      const rows: {
        token: {
          contract: { address: string }
          tokenId: string
          metadata?: Record<string, any>
        }
        balance: string
      }[] = await res.json()

      return rows
        .map((row) => {
          const decimals = Number(row.token.metadata?.decimals)
          return {
            contract: row.token.contract.address,
            tokenId: row.token.tokenId,
            symbol:
              row.token.metadata?.symbol ||
              row.token.metadata?.name ||
              `#${row.token.tokenId}`,
            decimals: Number.isFinite(decimals) ? decimals : 0,
            rawBalance: Number(row.balance || 0),
          }
        })
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  return { tokens: data ?? [], error, isLoading: !data && !error }
}

export default useTreasuryTokens
