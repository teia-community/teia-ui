// On-chain calendar contract types (mirrors src/data/wiki/types.ts).
//
// The teiaCalendar contract stores events keyed by an auto-incrementing integer
// event_id. Each event record holds only current_cid / hidden / version_count;
// all details live off-chain in the IPFS event document (CalendarEventContent).

/** A link shown on an event, stored in the IPFS document. */
export interface CalendarLink {
  label: string
  url: string
}

/** Simple recurrence rule (stored off-chain in the event document). */
export interface Recurrence {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  /** Inclusive end date (YYYY-MM-DD); mutually exclusive with `count`. */
  until?: string
  /** Total number of occurrences; mutually exclusive with `until`. */
  count?: number
}

/** The JSON document stored on IPFS for each event version. */
export interface CalendarEventContent {
  schema_version: number
  title: string
  startDate: string
  endDate?: string
  location?: string
  description?: string
  links: CalendarLink[]
  /** ipfs:// URIs. */
  images: string[]
  recurrence?: Recurrence
  author: string
  timestamp: string
}

/** Current state of an on-chain event, joined from the events + versions bigmaps. */
export interface ChainEvent {
  /** On-chain auto-incrementing event id. */
  id: number
  cid: string
  hidden: boolean
  versionCount: number
  /** Last on-chain editor (moderator/multisig who applied the current version). */
  editor: string
  proposer: string | null
  createdAt: string
  updatedAt: string
}

/**
 * An on-chain event mapped onto the shared CalendarEvent shape the calendar UI
 * renders (see src/data/calendar/schema.js). Carries the on-chain refs
 * (`eventId`, `cid`, `hidden`) the write actions need.
 */
export interface CalendarFeedEvent {
  id: string
  /** On-chain event id (numeric); `id` is `chain-<eventId>`. */
  eventId: number
  /** Current on-chain CID, for fetching the raw doc when editing. */
  cid: string
  hidden: boolean
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  links: CalendarLink[]
  images: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  source: 'chain'
  /** Present on recurring events; each occurrence carries the series rule. */
  recurrence?: Recurrence
  /** The series' first start (for building the RRULE on "Add to calendar"). */
  seriesStart?: string
  /** The series' first end (paired with seriesStart). */
  seriesEnd?: string
}

export type CalendarProposalStatus = 'pending' | 'approved' | 'rejected'

/** A community proposal, read from the `proposals` bigmap. */
export interface CalendarProposal {
  id: string
  /** Target event id for an edit proposal; null for a new-event proposal. */
  eventId: number | null
  proposedCid: string
  proposer: string
  isNewEvent: boolean
  status: CalendarProposalStatus
  createdAt: string
  resolvedBy?: string
  resolvedAt?: string
}
