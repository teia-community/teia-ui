import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Persisted drafts for the calendar create/edit form, so an in-progress event
 * survives a wallet-aborted transaction or a page refresh. Keyed by 'new' for a
 * new event or `edit-<eventId>` for an edit; cleared on a successful submit.
 */
interface CalendarDraftStore {
  drafts: Record<string, unknown>
  setDraft: (key: string, values: unknown) => void
  clearDraft: (key: string) => void
}

/** Draft key for a form session: 'new' or `edit-<eventId>`. */
export function draftKey(eventId: number | null): string {
  return eventId == null ? 'new' : `edit-${eventId}`
}

export const useCalendarDraftStore = create<CalendarDraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (key, values) =>
        set((s) => ({ drafts: { ...s.drafts, [key]: values } })),
      clearDraft: (key) =>
        set((s) => {
          if (!(key in s.drafts)) return s
          const drafts = { ...s.drafts }
          delete drafts[key]
          return { drafts }
        }),
    }),
    {
      name: 'teia-calendar-drafts',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
