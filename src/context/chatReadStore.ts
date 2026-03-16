import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ChatReadState {
  reads: Record<string, Record<string, number>>
  markRead: (address: string, roomKey: string, lastMessageId: number) => void
  getLastRead: (address: string, roomKey: string) => number
}

export const useChatReadStore = create<ChatReadState>()(
  persist(
    (set, get) => ({
      reads: {},
      markRead: (address, roomKey, lastMessageId) =>
        set((state) => {
          const current = state.reads[address]?.[roomKey] ?? 0
          if (lastMessageId <= current) return state
          return {
            reads: {
              ...state.reads,
              [address]: {
                ...state.reads[address],
                [roomKey]: lastMessageId,
              },
            },
          }
        }),
      getLastRead: (address, roomKey) =>
        get().reads[address]?.[roomKey] ?? 0,
    }),
    {
      name: 'shadownet-chat-read',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ reads: state.reads }),
    }
  )
)
