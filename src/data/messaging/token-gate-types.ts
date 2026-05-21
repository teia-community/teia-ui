// Token gate event types — expected payloads (contract has known issue, not yet tested)
// Contract: KT191Qg1dTK9XsrS6z5625co222KXWqgPBCV

import type { TzktEvent, TokenEmbed } from './channel-types'

export type { TzktEvent }

// --- Event payloads ---

export interface TgMessagePostedEvent {
  sender: string
  content: string // hex-encoded bytes
  fa2_address: string
  token_id: string
  parent_id: string | null
  timestamp: string
  message_id: string
}

export interface TgMessageDeletedEvent {
  fa2_address: string
  token_id: string
  deleted_by: string
  message_id: string
}

// --- Domain types ---

export interface TgMessagePayload {
  type: 'teia-tg-message'
  version: number
  content: string
  author: string
  timestamp: string
  parentId?: string
  embeds?: TokenEmbed[]
}

export interface TgMessage {
  id: string
  fa2Address: string
  tokenId: string
  sender: string
  content: string
  parentId: string | null
  timestamp: string
  embeds: TokenEmbed[]
  isIpfs: boolean
}

export interface TgContractStorage {
  message_fee: string
  messages: number // bigmap ID
}

/** Token metadata from TzKT /v1/tokens endpoint */
export interface TzktToken {
  id: number
  contract: { address: string }
  tokenId: string
  metadata: {
    name?: string
    symbol?: string
    displayUri?: string
    artifactUri?: string
    thumbnailUri?: string
  } | null
}
