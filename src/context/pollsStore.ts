import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware'
import { MichelsonMap } from '@taquito/taquito'
import { POLLS_CONTRACT} from '@constants'
import { Tezos, useUserStore } from './userStore'
import { useModalStore } from './modalStore'
import { stringToHex } from '@utils/string'

type OperationReturn = Promise<string | undefined>

interface PollsState {
  /** Votes in an existing poll */
  votePoll: (pollId: string, option: number, maxCheckpoints: number | null, callback?: any) => OperationReturn
  /** Creates a new poll */
  createPoll: (question: string, descriptionIpfsPath: string, voteWeightMethod: string, votePeriod: string, options: string[], callback?: any) => OperationReturn
}

export const usePollsStore = create<PollsState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        votePoll: async (pollId, option, maxCheckpoints, callback) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Vote teia poll'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(POLLS_CONTRACT)

            const parameters = {
              poll_id: parseInt(pollId),
              option: option,
              max_checkpoints: maxCheckpoints
            }
            const batch = contract.methodsObject.vote(parameters)
            const opHash = await handleOp(batch, modalTitle)

            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
        createPoll: async (question, descriptionIpfsPath, voteWeightMethod, votePeriod, options, callback) => {
          const handleOp = useUserStore.getState().handleOp
          const show = useModalStore.getState().show
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Create teia poll'

          if (!question || question.length < 10) {
            show(
              modalTitle,
              'The poll question must be at least 10 characters long'
            )
            return
          }

          if (options.length < 2) {
            show(
              modalTitle,
              'The poll should have at least 2 options to vote'
            )
            return
          }

          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(POLLS_CONTRACT)

            const parameters = {
              question: stringToHex(question),
              description: descriptionIpfsPath === ''
                ? stringToHex('')
                : stringToHex(`ipfs://${descriptionIpfsPath}`),
              options: MichelsonMap.fromLiteral(
                Object.fromEntries(
                  options.map((option, index) => [index, stringToHex(option)])
                )
              ),
              vote_weight_method: { [voteWeightMethod]: [['unit']] },
              vote_period: votePeriod
            }
            const batch = contract.methodsObject.create_poll(parameters)
            const opHash = await handleOp(batch, modalTitle)

            callback?.()

            return opHash
          } catch (e) {
            showError(modalTitle, e)
          }
        },
      }),
      {
        name: 'polls',
        storage: createJSONStorage(() => localStorage), // or sessionStorage?
      }
    )
  )
)
