import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from 'zustand/middleware'
import { UnitValue } from '@taquito/taquito'
import { stringToBytes } from '@taquito/utils'
import { TMNT_MESSAGING_CONTRACT } from '@constants'
import { Tezos, useUserStore } from './userStore'
import { useModalStore } from './modalStore'

type OperationReturn = Promise<string | undefined>

interface MessagingState {
  sendMessage: (
    content: string,
    recipients: string[],
    replyMode: string,
    fee: number
  ) => OperationReturn
  reply: (
    threadId: string,
    content: string,
    recipients: string[],
    fee: number
  ) => OperationReturn
  markAsRead: (messageIds: string[]) => OperationReturn
  deleteMessage: (messageId: string) => OperationReturn
}

export const useMessagingStore = create<MessagingState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        sendMessage: async (content, recipients, replyMode, fee) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Send message'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(TMNT_MESSAGING_CONTRACT)

            const modeKey = replyMode === 'sender_only' ? 'private' : 'public'
            const parameters = {
              content: stringToBytes(content),
              recipients,
              reply_mode: { [modeKey]: UnitValue },
            }
            const batch = contract.methodsObject.send_message(parameters)
            return await handleOp(batch, modalTitle, {
              amount: fee,
              mutez: true,
              storageLimit: 800,
            })
          } catch (e) {
            showError(modalTitle, e)
          }
        },

        reply: async (threadId, content, recipients, fee) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Reply'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(TMNT_MESSAGING_CONTRACT)

            const parameters = {
              thread_id: parseInt(threadId),
              content: stringToBytes(content),
              recipients,
            }
            const batch = contract.methodsObject.reply(parameters)
            return await handleOp(batch, modalTitle, {
              amount: fee,
              mutez: true,
              storageLimit: 400,
            })
          } catch (e) {
            showError(modalTitle, e)
          }
        },

        markAsRead: async (messageIds) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Mark as read'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(TMNT_MESSAGING_CONTRACT)
            const batch = contract.methodsObject.mark_as_read(
              messageIds.map((id) => parseInt(id))
            )
            return await handleOp(batch, modalTitle, {
              amount: 0,
              storageLimit: 400,
            })
          } catch (e) {
            showError(modalTitle, e)
          }
        },

        deleteMessage: async (messageId) => {
          const handleOp = useUserStore.getState().handleOp
          const showError = useModalStore.getState().showError
          const step = useModalStore.getState().step

          const modalTitle = 'Delete message'
          step(modalTitle, 'Waiting for confirmation', true)

          try {
            const contract = await Tezos.wallet.at(TMNT_MESSAGING_CONTRACT)
            const batch = contract.methodsObject.delete_message(
              parseInt(messageId)
            )
            return await handleOp(batch, modalTitle, { amount: 0 })
          } catch (e) {
            showError(modalTitle, e)
          }
        },
      }),
      {
        name: 'messaging',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
)
