import { create } from 'zustand'
import { Tezos, useUserStore } from './userStore'
import { useModalStore } from './modalStore'
import { COPYRIGHT_CONTRACT } from '../constants'

interface ProposalStore {
  submitProposal: (kind: string, text: string) => Promise<void>
  voteOnProposal: (proposalId: number, approval: boolean) => Promise<void>
  executeProposal: (proposalId: number) => Promise<void>
}

export const useProposalStore = create<ProposalStore>(() => ({
  submitProposal: async (kind, text) => {
    const show = useModalStore.getState().show
    const step = useModalStore.getState().step
    const showError = useModalStore.getState().showError
    const handleOp = useUserStore.getState().handleOp

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
  },

  voteOnProposal: async (proposalId, approval) => {
    const show = useModalStore.getState().show
    const step = useModalStore.getState().step
    const showError = useModalStore.getState().showError
    const handleOp = useUserStore.getState().handleOp

    const modalTitle = `Vote Proposal #${proposalId}`
    step(modalTitle, 'Awaiting signature...', true)

    try {
      const contract = await Tezos.wallet.at(COPYRIGHT_CONTRACT)

      const opHash = await handleOp(
        contract.methodsObject.vote_proposal({
          proposal_id: proposalId,
          approval,
        }),
        modalTitle
      )

      show(modalTitle, `Vote sent: https://tzkt.io/${opHash}`, true)
    } catch (err) {
      console.error('[Vote Error]', err)
      showError(modalTitle, err)
      throw err
    }
  },
  executeProposal: async (proposalId) => {
    const show = useModalStore.getState().show
    const step = useModalStore.getState().step
    const showError = useModalStore.getState().showError
    const handleOp = useUserStore.getState().handleOp

    const modalTitle = `Execute Proposal #${proposalId}`
    step(modalTitle, 'Preparing execution...', true)

    try {
      const contract = await Tezos.wallet.at(COPYRIGHT_CONTRACT)

      const opHash = await handleOp(
        contract.methodsObject.execute_proposal(proposalId),
        modalTitle
      )

      show(modalTitle, `Proposal executed: https://tzkt.io/${opHash}`, true)
    } catch (err) {
      console.error('[Execute Error]', err)
      showError(modalTitle, err)
      throw err
    }
  }
}))
