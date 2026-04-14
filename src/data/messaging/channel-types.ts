// Channel event types — based on tested Shadownet events
// Contract: KT1Vk9xjDRJM8ZxCV6YSGmzg3wcrBQhW69mS

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

export interface ChannelCreatedEvent {
  creator: string
  timestamp: string
  channel_id: string
  metadata_uri: string // hex-encoded bytes → ipfs://...
}

export interface ChannelConfiguredEvent {
  channel_id: string
  access_mode: Record<string, unknown> // Michelson variant, e.g. { unrestricted: {} }
  merkle_root?: string
  merkle_uri?: string // hex-encoded bytes
  metadata_uri?: string // hex-encoded bytes
}

export interface MessagePostedEvent {
  sender: string
  content: string // hex-encoded bytes → ipfs://... or JSON
  parent_id: string | null
  timestamp: string
  channel_id: string
  message_id: string
}

export interface MessageDeletedEvent {
  channel_id: string
  deleted_by: string
  message_id: string
}

export interface ChannelHiddenEvent {
  channel_id: string
}

export interface ChannelDeletedEvent {
  channel_id: string
}

// --- Domain types ---

export type ChannelAccessMode =
  | 'unrestricted'
  | 'members_only'
  | 'allowlist'
  | 'blocklist'

export interface ChannelMetadata {
  type: 'teia-channel'
  version: number
  name: string
  description: string
  image?: string // ipfs:// URI
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
  allowlist?: string[]
  messageCount: number
  latestMessageId: string | null
}

export interface ChannelMessage {
  id: string
  channelId: string
  sender: string
  content: string
  parentId: string | null
  timestamp: string
  embeds: TokenEmbed[]
  isIpfs: boolean
}

export interface ChannelContractStorage {
  channel_id_counter: string
  channels: number // bigmap ID
  messages: number // bigmap ID
  blocked: number // bigmap ID
  channel_admins: number // bigmap ID
  channel_fee: string
  message_fee: string
}
