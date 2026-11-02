// On-chain events registry types (mirrors src/data/calendar-chain/types.ts).
//
// The teiaEvents contract stores the events shown on the /events page, keyed
// by an auto-incrementing integer event_id. Each record holds only
// current_cid / hidden / version_count / proposer; all details live off-chain
// in the IPFS event document (EventContent). Not the calendar: no dates.

/** The JSON document stored on IPFS for each event version. */
export interface EventContent {
  schema_version: number
  title: string
  subtitle?: string
  description?: string
  /** http(s) URL of the event site, or a teia.art search URL. */
  link: string
  /** ipfs:// URI (uploaded) or a plain URL / site-relative path. */
  screenshot?: string
  /** #rrggbb */
  bannerColor?: string
  author: string
  timestamp: string
}

/** An event record as stored in the `events` bigmap. */
export interface ChainEventRecord {
  /** On-chain auto-incrementing event id. */
  id: number
  cid: string
  hidden: boolean
  versionCount: number
  /** Proposer of the approved proposal; null when a moderator created it. */
  proposer: string | null
}

/**
 * An on-chain event mapped onto the shape the events page and header dropdown
 * render (see src/data/events/api.js `mapEvent`), plus the on-chain refs the
 * write actions need.
 */
export interface ShowcaseEvent {
  /** String form of the on-chain event id. */
  id: string
  eventId: number
  cid: string
  hidden: boolean
  proposer: string | null
  title: string
  subtitle: string
  description: string
  link: string
  /** Display URL (ipfs:// already resolved to a gateway URL). */
  screenshot: string
  bannerColor: string
}

export type EventProposalStatus = 'pending' | 'approved' | 'rejected'

/** A community proposal for a new event, read from the `proposals` bigmap. */
export interface EventProposal {
  id: string
  proposedCid: string
  proposer: string
  status: EventProposalStatus
  createdAt: string
  resolvedBy?: string
  resolvedAt?: string
}
