/**
 * SWR hooks for fetching DM data from the Shadownet contract via TzKT.
 *
 * Room key uses peer-to-peer model with sorted address.
 * Rooms are auto-created on first message.
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { SHADOWNET_DM_CONTRACT } from '@constants'
import {
  fetchContractStorage,
  fetchContractEvents,
} from '../shadownet-tzkt'
import type {
  DmContractStorage,
  RoomKey,
  RoomCreatedEvent,
  DmMessagePostedEvent,
  DmMessageDeletedEvent,
  DmMessagePayload,
} from './dm-types'
import { roomKeyToString } from './dm-types'

const CONTRACT = SHADOWNET_DM_CONTRACT

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
// Room list
// ---------------------------------------------------------------------------

/** List rooms the user participates in. */
export function useRoomList(address: string | undefined) {
  return useSWR(
    address ? `shadownet:dm-rooms:${CONTRACT}:${address}` : null,
    async () => {
      if (!address) return []

      const [created, posted, msgDeleted] = await Promise.all([
        fetchContractEvents<RoomCreatedEvent>(CONTRACT, 'room_created'),
        fetchContractEvents<DmMessagePostedEvent>(CONTRACT, 'message_posted'),
        fetchContractEvents<DmMessageDeletedEvent>(CONTRACT, 'message_deleted'),
      ])

      const deletedMsgIds = new Set(msgDeleted.map((e) => e.payload.message_id))

      // Filter rooms where address is participant_a or participant_b
      const myRooms = created.filter((e) => {
        const rk = e.payload.room_key
        return rk.participant_a === address || rk.participant_b === address
      })

      // Count messages per room and track latest message ID
      const msgCounts: Record<string, number> = {}
      const latestMsgIds: Record<string, number> = {}
      const latestOtherMsgIds: Record<string, number> = {}
      const lastMessages: Record<string, DmMessagePostedEvent> = {}

      for (const e of posted) {
        if (deletedMsgIds.has(e.payload.message_id)) continue
        const rkStr = roomKeyToString(e.payload.room_key)
        const msgId = parseInt(e.payload.message_id)

        msgCounts[rkStr] = (msgCounts[rkStr] || 0) + 1

        if (!latestMsgIds[rkStr] || msgId > latestMsgIds[rkStr]) {
          latestMsgIds[rkStr] = msgId
        }

        if (e.payload.sender !== address) {
          if (!latestOtherMsgIds[rkStr] || msgId > latestOtherMsgIds[rkStr]) {
            latestOtherMsgIds[rkStr] = msgId
          }
        }

        lastMessages[rkStr] = e.payload
      }

      return myRooms.reverse().map((event) => {
        const rk = event.payload.room_key
        const rkStr = roomKeyToString(rk)
        const peer =
          rk.participant_a === address ? rk.participant_b : rk.participant_a

        const lastMsg = lastMessages[rkStr]
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
          roomKey: rk,
          roomKeyStr: rkStr,
          peer,
          timestamp: event.payload.timestamp,
          messageCount: msgCounts[rkStr] || 0,
          latestMessageId: latestMsgIds[rkStr] || 0,
          latestOtherMessageId: latestOtherMsgIds[rkStr] || 0,
          lastMessage: lastMsg
            ? {
                sender: lastMsg.sender,
                preview: lastMessagePreview.slice(0, 80),
                timestamp: lastMsg.timestamp,
              }
            : null,
        }
      })
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

export type RoomListItem = NonNullable<
  ReturnType<typeof useRoomList>['data']
>[number]

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** Fetch messages for a conversation via events. */
export function useDmMessages(roomKey: RoomKey | undefined) {
  return useSWR(
    roomKey
      ? `shadownet:dm-messages:${CONTRACT}:${roomKeyToString(roomKey)}`
      : null,
    async () => {
      if (!roomKey) return []

      const [posted, deleted] = await Promise.all([
        fetchContractEvents<DmMessagePostedEvent>(CONTRACT, 'message_posted', {
          'payload.room_key.participant_a': roomKey.participant_a,
          'payload.room_key.participant_b': roomKey.participant_b,
        }),
        fetchContractEvents<DmMessageDeletedEvent>(CONTRACT, 'message_deleted', {
          'payload.room_key.participant_a': roomKey.participant_a,
          'payload.room_key.participant_b': roomKey.participant_b,
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
            roomKey: p.room_key,
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
// Fees
// ---------------------------------------------------------------------------

export function useDmFees() {
  const { data: storage } = useDmStorage()
  return {
    messageFee: storage?.message_fee ? parseInt(storage.message_fee) : 0,
    paused: storage?.paused ?? false,
  }
}
