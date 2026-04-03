/**
 * SWR hooks for fetching token-gated chat data from Shadownet via TzKT
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { SHADOWNET_TOKEN_GATE_CONTRACT } from '@constants'
import {
  fetchContractStorage,
  fetchContractEvents,
} from '../shadownet-tzkt'
import type {
  TokenGateContractStorage,
  TgMessagePostedEvent,
  TgMessageDeletedEvent,
  TgMessagePayload,
  TzktToken,
} from './token-gate-types'

import { fetchMsgIpfsJson, msgIpfsToUrl } from './ipfs'

const CONTRACT = SHADOWNET_TOKEN_GATE_CONTRACT
const SHADOWNET_TZKT_API =
  import.meta.env.VITE_SHADOWNET_TZKT_API || 'https://api.shadownet.tzkt.io'

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function useTokenGateStorage() {
  return useSWR(
    `shadownet:tg-storage:${CONTRACT}`,
    () => fetchContractStorage<TokenGateContractStorage>(CONTRACT),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Token list (from TzKT token index)
// ---------------------------------------------------------------------------

/** Fetch tokens from an FA2 contract on Shadownet */
export function useFA2Tokens(fa2Address: string | undefined) {
  return useSWR(
    fa2Address ? `shadownet:fa2-tokens:${fa2Address}` : null,
    async () => {
      if (!fa2Address) return []
      const res = await fetch(
        `${SHADOWNET_TZKT_API}/v1/tokens?contract=${fa2Address}&limit=50`
      )
      if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
      return res.json() as Promise<TzktToken[]>
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** Fetch messages for a token room via events */
export function useTokenRoomMessages(
  fa2Address: string | undefined,
  tokenId: string | undefined
) {
  return useSWR(
    fa2Address && tokenId !== undefined
      ? `shadownet:tg-messages:${CONTRACT}:${fa2Address}:${tokenId}`
      : null,
    async () => {
      if (!fa2Address || tokenId === undefined) return []

      // Fetch all events and filter client-side by fa2_address + token_id
      const [posted, deleted] = await Promise.all([
        fetchContractEvents<TgMessagePostedEvent>(CONTRACT, 'message_posted'),
        fetchContractEvents<TgMessageDeletedEvent>(CONTRACT, 'message_deleted'),
      ])

      const deletedIds = new Set(deleted.map((e) => e.payload.message_id))

      const visible = posted.filter(
        (e) =>
          e.payload.fa2_address === fa2Address &&
          e.payload.token_id === tokenId &&
          !deletedIds.has(e.payload.message_id)
      )

      return Promise.all(
        visible.map(async (event) => {
          const p = event.payload
          const raw = p.content ? bytesToString(p.content) : ''
          let parsed: TgMessagePayload | null = null
          const isIpfs = raw.startsWith('ipfs://')

          if (isIpfs) {
            try {
              const json = await fetchMsgIpfsJson<TgMessagePayload>(raw)
              if (json.type === 'teia-tg-message') parsed = json
            } catch (e) {
              console.error(`IPFS fetch failed for message #${p.message_id}:`, e)
            }
          } else {
            try {
              const json = JSON.parse(raw)
              if (json.type === 'teia-tg-message') parsed = json
            } catch (e) {
              console.error(`Failed to parse message #${p.message_id}:`, e)
            }
          }

          return {
            id: parseInt(p.message_id),
            room_id: p.room_id,
            sender: p.sender,
            parent_id: p.parent_id,
            timestamp: p.timestamp,
            content: parsed ? parsed.content : raw,
            payload: parsed,
            isIpfs,
          }
        })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

export type ParsedTgMessage = NonNullable<
  ReturnType<typeof useTokenRoomMessages>['data']
>[number]

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

export function useTokenGateFees() {
  const { data: storage } = useTokenGateStorage()
  return {
    messageFee: storage?.message_fee ? parseInt(storage.message_fee) : 0,
    paused: storage?.paused ?? false,
  }
}
