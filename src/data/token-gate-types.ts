/**
 * Types for the token_gate.py contract.
 * Deployed at KT1AMEYYX9FPwFjZDACTnxvivBmWbtedqDbm on Shadownet.
 */

export interface TokenGateContractStorage {
  rooms: number
  room_keys: number
  messages: number
  pending_post: unknown
  room_id_counter: string
  message_id_counter: string
  message_fee: string
  fee_recipient: string
  multisig_address: string
  paused: boolean
  metadata: number
  proposals: number
  votes: number
  counter: string
}

// ---------------------------------------------------------------------------
// Event payload types
// ---------------------------------------------------------------------------

export interface TgMessagePostedEvent {
  room_id: string
  fa2_address: string
  token_id: string
  message_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

export interface TgMessageDeletedEvent {
  room_id: string
  message_id: string
  deleted_by: string
}

// ---------------------------------------------------------------------------
// TzKT token metadata
// ---------------------------------------------------------------------------

export interface TzktToken {
  id: number
  contract: { address: string }
  tokenId: string
  standard: string
  totalSupply: string
  metadata: {
    name?: string
    symbol?: string
    description?: string
    displayUri?: string
    artifactUri?: string
    thumbnailUri?: string
    [key: string]: unknown
  } | null
}

/** JSON payload stored on-chain as message content bytes. */
export interface TgMessagePayload {
  type: 'teia-tg-message'
  version: 1
  content: string
  author: string
  timestamp: string
  parentId?: number
}
