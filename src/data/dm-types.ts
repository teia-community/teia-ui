/**
 * Types for the direct_messages.py contract.
 * Deployed at KT1XRvc2PSxjkrSW7iXwHxPDdCf6kKnC8WZz on Shadownet.
 */

// ---------------------------------------------------------------------------
// Contract storage (from TzKT /v1/contracts/{addr}/storage)
// ---------------------------------------------------------------------------

export interface DmContractStorage {
  conversations: number
  messages: number
  participants: number
  conversation_admins: number
  conversation_id_counter: string
  message_id_counter: string
  message_fee: string
  conversation_fee: string
  paused: boolean
  fee_recipient: string
  multisig_address: string
  metadata: number
  proposals: number
  votes: number
  counter: string
}

// ---------------------------------------------------------------------------
// Event payload types (from TzKT /v1/contracts/events)
// ---------------------------------------------------------------------------

export interface ConversationCreatedEvent {
  conversation_id: string
  creator: string
  metadata_uri: string
  timestamp: string
}

export interface ParticipantsUpdatedEvent {
  conversation_id: string
  to_add: string[]
  to_remove: string[]
}

export interface ConversationDeletedEvent {
  conversation_id: string
  deleted_by: string
}

export interface ConversationAdminsUpdatedEvent {
  conversation_id: string
  to_add: string[]
  to_remove: string[]
}

export interface DmMessagePostedEvent {
  conversation_id: string
  message_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

export interface DmMessageDeletedEvent {
  conversation_id: string
  message_id: string
  deleted_by: string
}

export interface ConversationMetadata {
  type?: string
  version?: number
  name: string
  description: string
}

/** JSON payload stored on-chain as message content bytes. */
export interface DmMessagePayload {
  type: 'teia-dm-message'
  version: 1
  content: string
  author: string
  timestamp: string
  parentId?: number
}
