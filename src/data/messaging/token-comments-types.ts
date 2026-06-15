// Token comments event types, emitted by the token_comments contract.
//
// The topic of a token comment is the pair (fa2_address, token_id) —
// each comment carries its own pair, and the on-chain token gate is
// resolved per call against that FA2.

import type { TzktEvent } from './poll-comments-types'

export type { TzktEvent }

// --- Event payloads ---

export interface TokenCommentPostedEvent {
  fa2_address: string
  token_id: string
  comment_id: string
  sender: string
  parent_id: string | null
  timestamp: string
}

// --- Domain types ---

export interface TokenCommentPayload {
  type: 'teia-token-comment'
  version: number
  fa2Address: string
  tokenId: string
  content: string
  author: string
  timestamp: string
  parentId?: string
}

export interface TokenComment {
  id: string
  fa2Address: string
  tokenId: string
  sender: string
  content: string
  parentId: string | null
  timestamp: string
  hidden: boolean
  isIpfs: boolean
  version: number
}

/** An archived version of a token comment, from `comment_history`. */
export interface TokenCommentVersion {
  version: number
  timestamp: string
  content: string
  isIpfs: boolean
}
