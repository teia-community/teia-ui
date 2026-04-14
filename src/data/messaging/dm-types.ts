// DM event types — based on tested Shadownet events
// Contract: KT1SVEahFRGo9UdpL7YXQFuQMDvJcHtcHUh3

import type { TzktEvent, TokenEmbed } from './channel-types'

export type { TzktEvent }

// --- Event payloads ---

export interface RoomKey {
  participant_a: string
  participant_b: string
}

export interface RoomCreatedEvent {
  room_key: RoomKey
  timestamp: string
}

export interface DmMessagePostedEvent {
  sender: string
  content: string // hex-encoded bytes
  room_key: RoomKey
  parent_id: string | null
  timestamp: string
  message_id: string
}

export interface DmMessageDeletedEvent {
  room_key: RoomKey
  deleted_by: string
  message_id: string
}

// --- Domain types ---

export interface DmMessagePayload {
  type: 'teia-dm-message'
  version: number
  content: string
  author: string
  timestamp: string
  parentId?: string
  embeds?: TokenEmbed[]
}

export interface DmRoom {
  roomKey: RoomKey
  roomKeyStr: string
  createdAt: string
  lastMessagePreview: string | null
  latestMessageId: string | null
  latestOtherMessageId: string | null
  messageCount: number
}

export interface DmMessage {
  id: string
  roomKey: RoomKey
  sender: string
  content: string
  parentId: string | null
  timestamp: string
  embeds: TokenEmbed[]
  isIpfs: boolean
}

export interface DmContractStorage {
  room_id_counter: string
  rooms: number // bigmap ID
  message_fee: string
}

/**
 * Build a canonical room key from two addresses.
 * Addresses are sorted alphabetically so both participants
 * produce the same key.
 */
export function makeRoomKey(a: string, b: string): RoomKey {
  const sorted = [a, b].sort()
  return { participant_a: sorted[0], participant_b: sorted[1] }
}

/**
 * Convert a RoomKey to a string for use as cache/store keys.
 */
export function roomKeyToString(key: RoomKey): string {
  return `${key.participant_a}:${key.participant_b}`
}
