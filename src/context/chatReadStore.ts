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

/**
 * Generic per-item unread selector. Given a map of itemKey -> latestId and a
 * read-key prefix, returns which items are unread and the total count, by
 * comparing each item's latest id against reads[address]["<prefix>:<itemKey>"].
 */
export function useUnreadItems(
  address: string | undefined,
  prefix: string,
  latestByItem: Record<string, number> | undefined
) {
  const reads = useChatReadStore((st) => st.reads)

  return useMemo(() => {
    const unread: Record<string, boolean> = {}
    let total = 0

    if (!address || !latestByItem) return { unread, total }

    const userReads = reads[address] ?? {}
    for (const [itemKey, latestId] of Object.entries(latestByItem)) {
      const lastRead = userReads[`${prefix}:${itemKey}`] ?? 0
      if (latestId > lastRead) {
        unread[itemKey] = true
        total++
      }
    }

    return { unread, total }
  }, [address, prefix, latestByItem, reads])
}

export function useUnreadChannels(
  address: string | undefined,
  latestByChannel: Record<string, number> | undefined
) {
  return useUnreadItems(address, 'channel', latestByChannel)
}
