// When each activity feed was last looked at.
//
// Kept apart from the notification settings: the settings say which feeds the
// viewer cares about, this says how far they have already read. Both live in
// this browser only, and neither is tied to a wallet, because the activity
// feeds are the same for everyone.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ActivityFeedKey } from '@constants'

interface FeedReadState {
  /** Feed key -> ISO timestamp of the newest row the viewer has seen. */
  seen: Record<string, string>
  markSeen: (feed: ActivityFeedKey, timestamp?: string) => void
}

export const useFeedReadStore = create<FeedReadState>()(
  persist(
    (set, get) => ({
      seen: {},

      markSeen: (feed, timestamp) => {
        const next = timestamp ?? new Date().toISOString()
        const current = get().seen[feed]
        // Opening an older view of a feed should not un-read it.
        if (current && current >= next) return
        set((state) => ({ seen: { ...state.seen, [feed]: next } }))
      },
    }),
    {
      name: 'feed-read',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useFeedReadStore
