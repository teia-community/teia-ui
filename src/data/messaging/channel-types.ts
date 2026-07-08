import type { TzktEvent } from './poll-comments-types'

export type { TzktEvent }

// --- Event payloads ---

export interface ChannelCreatedEvent {
  channel_id: string
  creator: string
  metadata_uri: string
  access_mode: Record<string, unknown>
  merkle_root: string | null
  merkle_uri: string | null
  admins: string[]
  timestamp: string
}

export interface ChannelConfiguredEvent {
  channel_id: string
  access_mode: Record<string, unknown>
  merkle_root: string | null
  merkle_uri: string | null
  configured_by: string
}

export interface ChannelUpdatedEvent {
  channel_id: string
  metadata_uri: string
  updated_by: string
}

export interface ChannelAdminsUpdatedEvent {
  channel_id: string
  to_add: string[]
  to_remove: string[]
}

export interface ChannelHiddenEvent {
  channel_id: string
  hidden_by: string
}

export interface MessagePostedEvent {
  channel_id: string
  message_id: string
  sender: string
  parent_id: string | null
  timestamp: string
}

export interface MessageEditedEvent {
  channel_id: string
  message_id: string
  sender: string
  parent_id: string | null
  timestamp: string
  version: number
}

export interface MessageDeletedEvent {
  channel_id: string
  message_id: string
  deleted_by: string
}

// --- Domain types ---

export type ChannelAccessMode = 'unrestricted' | 'allowlist' | 'closed'

export type ChannelKind = 'dm' | 'channel'

export interface ChannelMetadata {
  type: 'teia-channel'
  version: number
  kind: ChannelKind
  name: string
  description: string
  image?: string
  participants?: string[]
}

export interface ChannelMessagePayload {
  type: 'teia-channel-message'
  version: number
  content: string
  author: string
  timestamp: string
  parentId?: string
  embeds?: TokenEmbed[]
}

export interface TokenEmbed {
  fa2: string
  tokenId: string
}

export interface Channel {
  id: string
  creator: string
  createdAt: string
  metadata: ChannelMetadata | null
  accessMode: ChannelAccessMode
  merkleRoot: string | null
  merkleUri: string | null
  merkleUsers?: string[]
  messageCount: number
  hidden: boolean
  latestMessageId: string | null
}

export interface ChannelMessage {
  id: string
  channelId: string
  sender: string
  content: string
  parentId: string | null
  timestamp: string
  hidden: boolean
  version: number
  embeds: TokenEmbed[]
  isIpfs: boolean
}

export interface ChannelMessageVersion {
  version: number
  timestamp: string
  content: string
  isIpfs: boolean
}

/** Raw shape of a row in the `messages` bigmap (TzKT decoded). */
export interface MessageBigmapRow {
  channel_id: string
  sender: string
  content: string
  parent_id: string | null
  hidden: boolean
  timestamp: string
  version: string
}

/** Archived version in the `message_history` bigmap. */
export interface MessageHistoryRow {
  channel_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}
