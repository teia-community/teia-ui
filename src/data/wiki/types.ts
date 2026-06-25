// Wiki contract types.
//
// The wiki contract stores pages keyed by an auto-incrementing integer
// `page_id` (no slug on-chain). Each page record holds only `current_cid`,
// `hidden` and `version_count`; the title/slug live off-chain in the IPFS
// page document (see WikiPageContent). Page hierarchy (the `parent`
// relationship) is also IPFS-only.

// --- IPFS document (the content the CID points at) ---

/**
 * The JSON document stored on IPFS for each page version.
 *
 * `slug` is a human-readable identifier kept for pretty internal links and
 * parent resolution; it is NOT used on-chain and uniqueness is enforced by
 * the UI only. `parent` is the slug of the parent page (the contract has no
 * notion of hierarchy); `null`/absent means a top-level page.
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

// --- Domain types (read from the pages / versions / proposals bigmaps) ---

/** Current state of a page, joined from the `pages` + `versions` bigmaps. */
export interface WikiPage {
  /** On-chain auto-incrementing page id (primary key). */
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

/** How the sidebar page list is ordered. */
export type WikiSortKey = 'title' | 'created' | 'updated'

/** A node in the sidebar tree (page + resolved children). */
export interface WikiTreeNode {
  id: number
  title: string
  /** Parent page id (resolved from the IPFS `parent` slug), or null. */
  parent: number | null
  createdAt: string
  updatedAt: string
  children: WikiTreeNode[]
}

/** One historical version of a page, from the `versions` bigmap. */
export interface WikiVersion {
  pageId: number
  version: number
  cid: string
  editor: string
  /** Set when the version originated from an approved community proposal. */
  proposer: string | null
  timestamp: string
}

export type WikiProposalStatus = 'pending' | 'approved' | 'rejected'

/** A community proposal, read from the `proposals` bigmap. */
export interface WikiProposal {
  id: string
  /** Target page id for an edit proposal; null for a new-page proposal. */
  pageId: number | null
  proposedCid: string
  proposer: string
  isNewPage: boolean
  status: WikiProposalStatus
  createdAt: string
  /** Moderator who resolved it (resolved_by), when resolved. */
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
