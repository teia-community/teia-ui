// Wiki contract types.
//
// The wiki contract stores only `slug -> current IPFS CID` plus version history
// and community proposals. Page hierarchy (the `parent` relationship) is not
// on-chain — it lives in the IPFS page document, see WikiPageContent below.

/** TzKT event wrapper (shared shape with the messaging module). */
export interface TzktEvent<P> {
  id: number
  level: number
  timestamp: string
  tag: string
  payload: P
  transactionId: number
}

// --- On-chain event payloads (emitted via sp.emit) ---

export interface PageCreatedEvent {
  slug: string
  cid: string
  hidden: boolean
  editor: string
  timestamp: string
}

export interface PageUpdatedEvent {
  slug: string
  cid: string
  hidden: boolean
  version: string
  editor: string
  proposer: string | null
  timestamp: string
}

export interface PageHiddenUpdatedEvent {
  slug: string
  hidden: boolean
  editor: string
  timestamp: string
}

export interface ProposalCreatedEvent {
  proposal_id: string
  page_slug: string
  proposed_cid: string
  proposer: string
  is_new_page: boolean
  timestamp: string
}

export interface ProposalApprovedEvent {
  proposal_id: string
  page_slug: string
  proposed_cid: string
  is_new_page: boolean
  approved_by: string
  timestamp: string
}

export interface ProposalRejectedEvent {
  proposal_id: string
  page_slug: string
  rejected_by: string
  timestamp: string
}

export const WIKI_EVENT_TAGS = {
  PAGE_CREATED: 'page_created',
  PAGE_UPDATED: 'page_updated',
  PAGE_HIDDEN_UPDATED: 'page_hidden_updated',
  PROPOSAL_CREATED: 'proposal_created',
  PROPOSAL_APPROVED: 'proposal_approved',
  PROPOSAL_REJECTED: 'proposal_rejected',
} as const

// --- IPFS document (the content the CID points at) ---

/**
 * The JSON document stored on IPFS for each page version.
 *
 * `parent` is the teia-ui addition: the contract has no notion of hierarchy,
 * so we track each page's parent slug here to build the sidebar tree.
 * `null` (or absent) means a top-level page.
 */
export interface WikiPageContent {
  schema_version: number
  title: string
  slug: string
  parent: string | null
  content: string
  format: 'markdown'
  author: string
  timestamp: string
  summary?: string
}

// --- Domain types (reconstructed from events / bigmaps) ---

/** Current state of a page, folded from its events. */
export interface WikiPage {
  slug: string
  cid: string
  hidden: boolean
  versionCount: number
  /** Last on-chain editor (moderator/multisig who applied the current version). */
  editor: string
  createdAt: string
  updatedAt: string
}

/** A node in the sidebar tree (page + resolved children). */
export interface WikiTreeNode {
  slug: string
  title: string
  parent: string | null
  children: WikiTreeNode[]
}

/** One historical version of a page, from the `versions` bigmap. */
export interface WikiVersion {
  slug: string
  version: number
  cid: string
  editor: string
  /** Set when the version originated from an approved community proposal. */
  proposer: string | null
  timestamp: string
}

export type WikiProposalStatus = 'pending' | 'approved' | 'rejected'

/** A community proposal, folded from proposal_* events. */
export interface WikiProposal {
  id: string
  pageSlug: string
  proposedCid: string
  proposer: string
  isNewPage: boolean
  status: WikiProposalStatus
  createdAt: string
  /** TzKT operation id of the proposal_created tx (for the tzkt link). */
  transactionId?: number
  /** Moderator who resolved it (approved_by / rejected_by), when resolved. */
  resolvedBy?: string
  resolvedAt?: string
}

/** What the current user is allowed to do (UI gating; chain enforces for real). */
export interface WikiUserRoles {
  isModerator: boolean
  isMultisig: boolean
  /** Either of the above — can create/update/hide pages and resolve proposals. */
  canModerate: boolean
  /** Holds the DAO token — can submit community proposals. */
  canPropose: boolean
}
