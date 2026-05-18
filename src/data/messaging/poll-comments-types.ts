// Poll comments event types, emitted by the poll_comments contract.

/** TzKT event wrapper */
export interface TzktEvent<P> {
  id: number
  level: number
  timestamp: string
  tag: string
  payload: P
  transactionId: number
}

// --- Event payloads ---

export interface CommentPostedEvent {
  poll_id: string
  comment_id: string
  sender: string
  parent_id: string | null
  timestamp: string
}

export interface CommentEditedEvent {
  comment_id: string
  sender: string
}

export interface CommentHiddenSetEvent {
  comment_id: string
  hidden: boolean
  updated_by: string
}

// --- Domain types ---

export interface CommentPayload {
  type: 'teia-poll-comment'
  version: number
  pollId: string
  content: string
  author: string
  timestamp: string
  parentId?: string
}

export interface PollComment {
  id: string
  pollId: string
  sender: string
  content: string
  parentId: string | null
  timestamp: string
  hidden: boolean
  isIpfs: boolean
}
