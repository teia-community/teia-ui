// What the notification maps carry.
//
// The comment scans already know when each comment was posted; keeping the
// timestamp alongside the id is what lets the notifications page order one
// contract's comments against another's.

export interface NotificationActivity {
  /** Highest comment id seen for this poll / token, for the unread check. */
  id: number
  /** When that comment was posted. */
  timestamp: string
}

/** Drops back to the id-only shape the unread selectors compare against. */
export function toLatestIds(
  activity: Record<string, NotificationActivity> | undefined
): Record<string, number> | undefined {
  if (!activity) return undefined
  return Object.fromEntries(
    Object.entries(activity).map(([key, value]) => [key, value.id])
  )
}
