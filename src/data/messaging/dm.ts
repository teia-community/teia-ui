/**
 * SWR hooks for fetching DM data from the Shadownet contract via TzKT.
 *
 * Feeds (conversation list, messages) use TzKT events.
 * Access checks (participant, admin) use bigmap queries.
 * 
 * 
 * Subject to change.
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { SHADOWNET_DM_CONTRACT } from '@constants'
import {
  fetchContractStorage,
  fetchContractEvents,
  fetchBigMapKeys,
} from '../shadownet-tzkt'
import type {
  DmContractStorage,
  ConversationCreatedEvent,
  ConversationDeletedEvent,
  ParticipantsUpdatedEvent,
  DmMessagePostedEvent,
  DmMessageDeletedEvent,
  ConversationMetadata,
  DmMessagePayload,
} from './dm-types'

const CONTRACT = SHADOWNET_DM_CONTRACT

function ipfsToUrl(uri: string): string {
  const cid = uri.replace('ipfs://', '')
  return `https://ipfs.io/ipfs/${cid}`
}

const IPFS_GATEWAYS = [
  (cid: string) => `https://ipfs.io/ipfs/${cid}`,
  (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
  (cid: string) => `https://dweb.link/ipfs/${cid}`,
]

async function fetchIpfsJson<T>(uri: string): Promise<T> {
  const cid = uri.replace('ipfs://', '')
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const res = await fetch(gateway(cid))
      if (res.ok) return res.json()
    } catch (e) {
      // try next gateway
    }
  }
  throw new Error(`IPFS fetch failed for ${uri}: all gateways exhausted`)
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function useDmStorage() {
  return useSWR(
    `shadownet:dm-storage:${CONTRACT}`,
    () => fetchContractStorage<DmContractStorage>(CONTRACT),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Conversation list
// ---------------------------------------------------------------------------

/** List conversations the user participates in (event-based). */
export function useConversationList(address: string | undefined) {
  return useSWR(
    address ? `shadownet:dm-conversations:${CONTRACT}:${address}` : null,
    async () => {
      if (!address) return []

      const [created, deleted, participantEvents, posted, msgDeleted] =
        await Promise.all([
          fetchContractEvents<ConversationCreatedEvent>(CONTRACT, 'conversation_created'),
          fetchContractEvents<ConversationDeletedEvent>(CONTRACT, 'conversation_deleted'),
          fetchContractEvents<ParticipantsUpdatedEvent>(CONTRACT, 'participants_updated'),
          fetchContractEvents<DmMessagePostedEvent>(CONTRACT, 'message_posted'),
          fetchContractEvents<DmMessageDeletedEvent>(CONTRACT, 'message_deleted'),
        ])

      const deletedIds = new Set(deleted.map((e) => e.payload.conversation_id))
      const deletedMsgIds = new Set(msgDeleted.map((e) => e.payload.message_id))

      // Build participant sets per conversation
      const participantSets: Record<string, Set<string>> = {}
      for (const e of created) {
        participantSets[e.payload.conversation_id] = new Set([e.payload.creator])
      }
      for (const e of participantEvents) {
        const id = e.payload.conversation_id
        if (!participantSets[id]) participantSets[id] = new Set()
        for (const addr of e.payload.to_add) participantSets[id].add(addr)
        for (const addr of e.payload.to_remove) participantSets[id].delete(addr)
      }

      // Filter to conversations where user is a participant and not deleted
      const myConversations = created.filter((e) => {
        const id = e.payload.conversation_id
        return !deletedIds.has(id) && participantSets[id]?.has(address)
      })

      // Count messages per conversation and track latest message ID
      const msgCounts: Record<string, number> = {}
      const latestMsgIds: Record<string, number> = {}
      for (const e of posted) {
        if (!deletedMsgIds.has(e.payload.message_id)) {
          const cId = e.payload.conversation_id
          msgCounts[cId] = (msgCounts[cId] || 0) + 1
          const msgId = parseInt(e.payload.message_id)
          if (!latestMsgIds[cId] || msgId > latestMsgIds[cId]) {
            latestMsgIds[cId] = msgId
          }
        }
      }
      // Track latest message ID excluding the viewer's own messages (for unread dots)
      const latestOtherMsgIds: Record<string, number> = {}
      for (const e of posted) {
        if (!deletedMsgIds.has(e.payload.message_id) && e.payload.sender !== address) {
          const cId = e.payload.conversation_id
          const msgId = parseInt(e.payload.message_id)
          if (!latestOtherMsgIds[cId] || msgId > latestOtherMsgIds[cId]) {
            latestOtherMsgIds[cId] = msgId
          }
        }
      }

      // Get last message per conversation for preview
      const lastMessages: Record<string, DmMessagePostedEvent> = {}
      for (const e of posted) {
        if (!deletedMsgIds.has(e.payload.message_id)) {
          const cId = e.payload.conversation_id
          lastMessages[cId] = e.payload
        }
      }

      return Promise.all(
        myConversations.reverse().map(async (event) => {
          const p = event.payload
          const metadataUri = p.metadata_uri
            ? bytesToString(p.metadata_uri)
            : ''
          let metadata: ConversationMetadata = {
            name: `Conversation #${p.conversation_id}`,
            description: '',
          }
          if (metadataUri.startsWith('ipfs://')) {
            try {
              metadata = await fetchIpfsJson<ConversationMetadata>(metadataUri)
            } catch (e) {
              console.warn(`Failed to fetch metadata for conversation #${p.conversation_id}:`, e)
            }
          }

          const participants = participantSets[p.conversation_id]
            ? [...participantSets[p.conversation_id]]
            : [p.creator]

          const lastMsg = lastMessages[p.conversation_id]
          let lastMessagePreview = ''
          if (lastMsg) {
            try {
              const raw = bytesToString(lastMsg.content)
              const json = JSON.parse(raw)
              lastMessagePreview = json.content || raw
            } catch (e) {
              console.error(`Failed to parse last message preview:`, e)
              lastMessagePreview = bytesToString(lastMsg.content)
            }
          }

          return {
            id: parseInt(p.conversation_id),
            creator: p.creator,
            metadata,
            metadataUri,
            timestamp: p.timestamp,
            participants,
            messageCount: msgCounts[p.conversation_id] || 0,
            latestMessageId: latestMsgIds[p.conversation_id] || 0,
            latestOtherMessageId: latestOtherMsgIds[p.conversation_id] || 0,
            lastMessage: lastMsg
              ? {
                  sender: lastMsg.sender,
                  preview: lastMessagePreview.slice(0, 80),
                  timestamp: lastMsg.timestamp,
                }
              : null,
          }
        })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

export type ConversationListItem = NonNullable<
  ReturnType<typeof useConversationList>['data']
>[number]

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** Fetch messages for a conversation via events. */
export function useDmMessages(conversationId: number | undefined) {
  return useSWR(
    conversationId !== undefined
      ? `shadownet:dm-messages:${CONTRACT}:${conversationId}`
      : null,
    async () => {
      if (conversationId === undefined) return []

      const [posted, deleted] = await Promise.all([
        fetchContractEvents<DmMessagePostedEvent>(CONTRACT, 'message_posted', {
          'payload.conversation_id': String(conversationId),
        }),
        fetchContractEvents<DmMessageDeletedEvent>(CONTRACT, 'message_deleted', {
          'payload.conversation_id': String(conversationId),
        }),
      ])

      const deletedIds = new Set(deleted.map((e) => e.payload.message_id))
      const visible = posted.filter((e) => !deletedIds.has(e.payload.message_id))

      return Promise.all(
        visible.map(async (event) => {
          const p = event.payload
          const raw = p.content ? bytesToString(p.content) : ''
          let parsed: DmMessagePayload | null = null
          const isIpfs = raw.startsWith('ipfs://')

          if (isIpfs) {
            try {
              const json = await fetchIpfsJson<DmMessagePayload>(raw)
              if (json.type === 'teia-dm-message') parsed = json
            } catch (e) {
              console.error(`IPFS fetch failed for message #${p.message_id}:`, e)
            }
          } else {
            try {
              const json = JSON.parse(raw)
              if (json.type === 'teia-dm-message') parsed = json
            } catch (e) {
              console.error(`Failed to parse message #${p.message_id}:`, e)
            }
          }

          return {
            id: parseInt(p.message_id),
            conversation_id: p.conversation_id,
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

export type ParsedDmMessage = NonNullable<
  ReturnType<typeof useDmMessages>['data']
>[number]

// ---------------------------------------------------------------------------
// Access checks (bigmap-based)
// ---------------------------------------------------------------------------

/** Check if an address is a participant in a conversation. */
export function useIsParticipant(
  conversationId: number | undefined,
  address: string | undefined
) {
  const { data: storage } = useDmStorage()
  const bigmapId = storage?.participants

  return useSWR(
    bigmapId && conversationId !== undefined && address
      ? `shadownet:dm-participant:${bigmapId}:${conversationId}:${address}`
      : null,
    async () => {
      if (!bigmapId || conversationId === undefined || !address) return false
      const entries = await fetchBigMapKeys(bigmapId, {
        'key.conversation_id': String(conversationId),
        'key.address': address,
        limit: '1',
      })
      return entries.length > 0
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

/** Check if an address is a conversation admin. */
export function useIsDmAdmin(
  conversationId: number | undefined,
  address: string | undefined
) {
  const { data: storage } = useDmStorage()
  const bigmapId = storage?.conversation_admins

  return useSWR(
    bigmapId && conversationId !== undefined && address
      ? `shadownet:dm-admin:${bigmapId}:${conversationId}:${address}`
      : null,
    async () => {
      if (!bigmapId || conversationId === undefined || !address) return false
      const entries = await fetchBigMapKeys(bigmapId, {
        'key.conversation_id': String(conversationId),
        'key.address': address,
        limit: '1',
      })
      return entries.length > 0
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

export function useDmFees() {
  const { data: storage } = useDmStorage()
  return {
    messageFee: storage?.message_fee ? parseInt(storage.message_fee) : 0,
    conversationFee: storage?.conversation_fee
      ? parseInt(storage.conversation_fee)
      : 0,
    paused: storage?.paused ?? false,
  }
}
