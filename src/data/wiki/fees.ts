import useSWR from 'swr'
import { WIKI_CONTRACT, BURN_ADDRESS } from '@constants'
import { Tezos, useUserStore } from '@context/userStore'

export interface WikiFees {
  proposePageFee: number
  proposeEditFee: number
}

export function useWikiFees() {
  const userAddress = useUserStore((st) => st.address)
  const viewCaller = userAddress || BURN_ADDRESS

  return useSWR<WikiFees>(
    `wiki:fees:${WIKI_CONTRACT}:${viewCaller}`,
    async () => {
      const contract = await Tezos.contract.at(WIKI_CONTRACT)
      const fees = await contract.contractViews
        .get_fees()
        .executeView({ viewCaller })
      return {
        proposePageFee: Number(fees.propose_page_fee ?? 0),
        proposeEditFee: Number(fees.propose_edit_fee ?? 0),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}
