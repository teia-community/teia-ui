import { create } from 'zustand'
import { Tezos, useUserStore } from './userStore'
import { useModalStore } from './modalStore'
import { COPYRIGHT_CONTRACT } from '../constants'

interface ProposalStore {
  submitProposal: (kind: string, text: string) => Promise<void>
}

export const useProposalStore = create<ProposalStore>(() => ({
  submitProposal: async (kind, text) => {
    const show = useModalStore.getState().show
    const step = useModalStore.getState().step
    const showError = useModalStore.getState().showError
    const handleOp = useUserStore.getState().handleOp
    const address = useUserStore.getState().address

    const modalTitle = 'Submit Proposal'
    step(modalTitle, 'Waiting for confirmation...', true)

    try {
      const contract = await Tezos.wallet.at(COPYRIGHT_CONTRACT)
      let packed

      switch (kind) {
        case 'treasury_fee':
          packed = await Tezos.rpc.packData({ data: { int: text }, type: { prim: 'mutez' } })
          break
        case 'treasury_address':
        case 'multisig_address':
          packed = await Tezos.rpc.packData({ data: { string: text }, type: { prim: 'address' } })
          break
        case 'agreement_text':
        case 'copyright_state':
          packed = await Tezos.rpc.packData({ data: { string: text }, type: { prim: 'string' } })
          break
        default:
          throw new Error('Invalid proposal kind')
      }

      const opHash = await handleOp(
        contract.methodsObject.submit_proposal({
          kind: { [kind]: null },
          text: packed.packed,
        }),
        modalTitle
      )

      show(modalTitle, `Proposal submitted: https://tzkt.io/${opHash}`, true)
    } catch (err) {
      console.error('[Proposal Error]', err)
      showError(modalTitle, err)
      throw err
    }
  }
}))
