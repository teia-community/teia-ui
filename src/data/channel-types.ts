/**
 * Types matching the channel_v1.py contract.
 * Deployed at KT1XKBVDayib1Ny36DXtbgnmrTdqJS3tAj2o on Shadownet.
 */

export type AccessMode = 'unrestricted' | 'allowlist' | 'blocklist'

export interface Channel {
  id: number
  creator: string
  metadata_uri: string
  access_mode:
    | { unrestricted: string }
    | { allowlist: string }
    | { blocklist: string }
  merkle_root: string | null
  merkle_uri: string | null
  message_count: string
  hidden: boolean
  timestamp: string
}

export interface ChannelMetadata {
  type?: string
  version?: number
  name: string
  description: string
  image?: string
}

/** JSON payload stored on-chain as message content bytes. */
export interface ChannelMessagePayload {
  type: 'teia-channel-message'
  version: 1
  content: string
  author: string
  timestamp: string
  parentId?: number
}

export interface ChannelMessage {
  id: number
  channel_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

export interface ChannelContractStorage {
  channels: number
  messages: number
  blocked: number
  channel_admins: number
  channel_id_counter: string
  message_id_counter: string
  message_fee: string
  channel_fee: string
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

export interface ChannelCreatedEvent {
  channel_id: string
  creator: string
  metadata_uri: string
  timestamp: string
}

export interface ChannelHiddenEvent {
  channel_id: string
  hidden_by: string
}

export interface ChannelDeletedEvent {
  channel_id: string
  deleted_by: string
}

export interface MessagePostedEvent {
  channel_id: string
  message_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

export interface ChannelConfiguredEvent {
  channel_id: string
  access_mode:
    | { unrestricted: string }
    | { allowlist: string }
    | { blocklist: string }
  merkle_root: string | null
  merkle_uri: string | null
  configured_by: string
}

export interface MessageDeletedEvent {
  channel_id: string
  message_id: string
  deleted_by: string
}
