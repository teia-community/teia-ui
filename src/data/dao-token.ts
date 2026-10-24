// The TEIA token itself, as the indexer holds it.

import useSWR from 'swr'
import { DAO_TOKEN_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { tzktFetch } from './tzkt'

const TZKT_API = import.meta.env.VITE_TZKT_API

export interface DaoToken {
  holders: number
  supply: number
  transfers: number
}

/** Holders, supply and transfers of the DAO token. */
export function useDaoToken() {
  const { data, error } = useSWR<DaoToken>(
    'dao:token',
    async () => {
      const rows = await tzktFetch<
        {
          holdersCount: number
          transfersCount: number
          totalSupply: string
        }[]
      >(`${TZKT_API}/v1/tokens?contract=${DAO_TOKEN_CONTRACT}&tokenId=0`)
      const row = rows[0]
      return {
        holders: Number(row?.holdersCount ?? 0),
        supply: Number(row?.totalSupply ?? 0) / DAO_TOKEN_DECIMALS,
        transfers: Number(row?.transfersCount ?? 0),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )
  return { token: data, error }
}

export default useDaoToken
