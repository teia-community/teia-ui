import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ChatReadState {
  /** reads[walletAddress][roomKey] = lastReadMessageId (stored as number for comparison) */
  reads: Record<string, Record<string, number>>
  markRead: (address: string, roomKey: string, messageId: string | number) => void
  getLastRead: (address: string, roomKey: string) => number
}

export const useChatReadStore = create<ChatReadState>()(
  persist(
    (set, get) => ({
      reads: {},

      markRead: (address, roomKey, messageId) => {
        const numId = typeof messageId === 'string' ? parseInt(messageId, 10) : messageId
        const current = get().reads[address]?.[roomKey] ?? 0
        if (isNaN(numId) || numId <= current) return

        set((state) => ({
          reads: {
            ...state.reads,
            [address]: {
              ...state.reads[address],
              [roomKey]: numId,
            },
          },
        }))
      },

      getLastRead: (address, roomKey) => {
        return get().reads[address]?.[roomKey] ?? 0
      },
    }),
    {
      name: 'chat-read',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
