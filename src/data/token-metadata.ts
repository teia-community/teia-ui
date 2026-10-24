// What a token is called and how many decimals it uses.
//
// Multisig proposals record token amounts in the token's smallest unit, so a
// transfer of 3,100 USDt is stored as 3,100,000,000. Shown raw that is
// unreadable, and worse, it is easy to misread by a factor of a million when
// writing one. Decimals differ per token -- 6 for USDt, 18 for wrapped ETH --
// so they have to be looked up rather than assumed.

import useSWR from 'swr'

import { tzktFetch } from './tzkt'

const TZKT_API = import.meta.env.VITE_TZKT_API

export interface TokenInfo {
  contract: string
  tokenId: string
  symbol: string
  decimals: number
}

/** A readable fallback for a token with no metadata of its own. */
function unknownToken(contract: string, tokenId: string): TokenInfo {
  return { contract, tokenId, symbol: `#${tokenId}`, decimals: 0 }
}

async function fetchTokens(keys: string[]): Promise<Record<string, TokenInfo>> {
  const out: Record<string, TokenInfo> = {}
  if (keys.length === 0) return out

  // One request per contract, asking only for the ids actually referenced.
  const byContract = new Map<string, string[]>()
  for (const key of keys) {
    const [contract, tokenId] = key.split(':')
    byContract.set(contract, [...(byContract.get(contract) ?? []), tokenId])
  }

  await Promise.all(
    [...byContract.entries()].map(async ([contract, ids]) => {
      try {
        const url = new URL(`${TZKT_API}/v1/tokens`)
        url.searchParams.set('contract', contract)
        url.searchParams.set('tokenId.in', [...new Set(ids)].join(','))
        url.searchParams.set('select', 'tokenId,metadata')
        url.searchParams.set('limit', '100')

        const rows = await tzktFetch<
          { tokenId: string; metadata?: Record<string, any> }[]
        >(url.toString())

        for (const row of rows) {
          const decimals = Number(row.metadata?.decimals)
          out[`${contract}:${row.tokenId}`] = {
            contract,
            tokenId: row.tokenId,
            symbol:
              row.metadata?.symbol || row.metadata?.name || `#${row.tokenId}`,
            // A token whose decimals cannot be read is treated as whole
            // units, which shows the raw figure rather than a wrong one.
            decimals: Number.isFinite(decimals) ? decimals : 0,
          }
        }
      } catch {
        for (const id of ids) out[`${contract}:${id}`] = unknownToken(contract, id)
      }
    })
  )

  for (const key of keys) {
    if (!out[key]) {
      const [contract, tokenId] = key.split(':')
      out[key] = unknownToken(contract, tokenId)
    }
  }
  return out
}

/** Metadata for a set of `contract:tokenId` keys. */
export function useTokenInfo(keys: string[]) {
  const sorted = [...new Set(keys)].sort()
  const { data } = useSWR(
    sorted.length > 0 ? ['token-info', sorted.join(',')] : null,
    () => fetchTokens(sorted),
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )

  return (contract: string, tokenId: string): TokenInfo =>
    data?.[`${contract}:${tokenId}`] ?? unknownToken(contract, tokenId)
}

export default useTokenInfo
