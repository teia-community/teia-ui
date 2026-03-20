/**
 * Types for the peer-to-peer DM contract. (updated contract, in review)
 * Deployed at KT1XfKT51Priwn7Ta9DMTeY63Q2WeGZYZSBc on Shadownet.
 */

// ---------------------------------------------------------------------------
// Contract storage (from TzKT /v1/contracts/{addr}/storage)
// ---------------------------------------------------------------------------

export interface DmContractStorage {
  rooms: number
  messages: number
  message_id_counter: string
  message_fee: string
  paused: boolean
  fee_recipient: string
  multisig_address: string
  metadata: number
  proposals: number
  votes: number
  counter: string
}

// ---------------------------------------------------------------------------
// Room key helpers
// ---------------------------------------------------------------------------

export interface RoomKey {
  participant_a: string
  participant_b: string
}

/** Create a canonical room key, addresses sorted alphabetically. */
export function makeRoomKey(a: string, b: string): RoomKey {
  return a < b
    ? { participant_a: a, participant_b: b }
    : { participant_a: b, participant_b: a }
}

/** Room key */
export function roomKeyToString(key: RoomKey): string {
  return `${key.participant_a}:${key.participant_b}`
}

// ---------------------------------------------------------------------------
// Event payload types (from TzKT /v1/contracts/events)
// ---------------------------------------------------------------------------

export interface RoomCreatedEvent {
  room_key: RoomKey
  timestamp: string
}

export interface DmMessagePostedEvent {
  room_key: RoomKey
  message_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

export interface DmMessageDeletedEvent {
  room_key: RoomKey
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
  embeds?: unknown[]
}
