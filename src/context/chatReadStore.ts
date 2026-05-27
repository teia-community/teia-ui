import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ChatReadState {
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

export function useUnreadChannels(
  address: string | undefined,
  latestByChannel: Record<string, number> | undefined
) {
  const reads = useChatReadStore((st) => st.reads)

  return useMemo(() => {
    const unread: Record<string, boolean> = {}
    let total = 0

    if (!address || !latestByChannel) return { unread, total }

    const userReads = reads[address] ?? {}
    for (const [channelId, latestId] of Object.entries(latestByChannel)) {
      const lastRead = userReads[`channel:${channelId}`] ?? 0
      if (latestId > lastRead) {
        unread[channelId] = true
        total++
      }
    }

    return { unread, total }
  }, [address, latestByChannel, reads])
}

export function useHasNewNotification(
  address: string | undefined,
  key: string,
  latestId: number | undefined
) {
  const reads = useChatReadStore((st) => st.reads)

  return useMemo(() => {
    if (!address || latestId === undefined || latestId === 0) return false
    const lastRead = reads[address]?.[key] ?? 0
    return latestId > lastRead
  }, [address, key, latestId, reads])
}
