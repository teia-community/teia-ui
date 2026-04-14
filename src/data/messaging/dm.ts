/**
 * SWR hooks for fetching DM data via TzKT events.
 *
 * Room key uses peer-to-peer model with sorted addresses.
 * Rooms are auto-created on first message.
 * Messages are paginated (newest first, 50 per page).
 */
import useSWR from 'swr'
import { useCallback, useRef, useState } from 'react'
import { bytesToString } from '@taquito/utils'
import { MESSAGING_DM_CONTRACT } from '@constants'
import { fetchAllEvents, fetchEventsPage, fetchContractStorage } from './api'
import { fetchMsgIpfsJson } from './ipfs'
import type {
  RoomKey,
  RoomCreatedEvent,
  DmMessagePostedEvent,
  DmMessageDeletedEvent,
  DmMessagePayload,
  DmContractStorage,
} from './dm-types'
import { roomKeyToString } from './dm-types'

const CONTRACT = MESSAGING_DM_CONTRACT
const MESSAGE_PAGE_SIZE = 50

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeBytes(hex: string): string {
  try {
    return hex ? bytesToString(hex) : ''
  } catch {
    return ''
  }
}

async function parseDmMessage(event: { payload: DmMessagePostedEvent }) {
  const p = event.payload
  const raw = decodeBytes(p.content)
  const isIpfs = raw.startsWith('ipfs://')
  let parsed: DmMessagePayload | null = null

  try {
    if (isIpfs) {
      const json = await fetchMsgIpfsJson<DmMessagePayload>(raw)
      if (json.type === 'teia-dm-message') parsed = json
    } else if (raw) {
      const json = JSON.parse(raw)
      if (json.type === 'teia-dm-message') parsed = json
    }
  } catch (e) {
    console.warn(`Failed to parse DM message #${p.message_id}:`, e)
  }

  return {
    id: p.message_id,
    roomKey: p.room_key,
    sender: p.sender,
    parentId: p.parent_id,
    timestamp: p.timestamp,
    content: parsed?.content ?? raw,
    embeds: parsed?.embeds ?? [],
    isIpfs,
  }
}

/**
 * Resolve last message preview, handling both on-chain and IPFS messages.
 */
async function resolvePreview(contentHex: string): Promise<string> {
  const raw = decodeBytes(contentHex)
  if (raw.startsWith('ipfs://')) {
    try {
      const json = await fetchMsgIpfsJson<DmMessagePayload>(raw)
      return json.content?.slice(0, 80) ?? ''
    } catch {
      return ''
    }
  }
  try {
    const json = JSON.parse(raw)
    return (json.content ?? raw).slice(0, 80)
  } catch {
    return raw.slice(0, 80)
  }
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function useDmStorage() {
  return useSWR(
    `msg:dm-storage:${CONTRACT}`,
    () => fetchContractStorage<DmContractStorage>(CONTRACT),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Room list
// ---------------------------------------------------------------------------

/**
 * List DM rooms for a user.
 *
 * Fetches room_created events and filters by participant.
 * TzKT doesn't support OR filtering, so we fetch rooms where
 * the user is participant_a, then participant_b, and merge.
 */
export function useRoomList(address: string | undefined) {
  return useSWR(
    address ? `msg:dm-rooms:${CONTRACT}:${address}` : null,
    async () => {
      if (!address) return []

      // Fetch rooms where user is participant_a or participant_b
      const [roomsAsA, roomsAsB] = await Promise.all([
        fetchAllEvents<RoomCreatedEvent>(CONTRACT, 'room_created', {
          'payload.room_key.participant_a': address,
        }),
        fetchAllEvents<RoomCreatedEvent>(CONTRACT, 'room_created', {
          'payload.room_key.participant_b': address,
        }),
      ])

      // Deduplicate by room key string
      const seen = new Set<string>()
      const allRooms = [...roomsAsA, ...roomsAsB].filter((e) => {
        const key = roomKeyToString(e.payload.room_key)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // For each room, fetch the latest message for preview
      return Promise.all(
        allRooms.reverse().map(async (event) => {
          const rk = event.payload.room_key
          const rkStr = roomKeyToString(rk)
          const peer =
            rk.participant_a === address ? rk.participant_b : rk.participant_a

          // Fetch just the latest message for this room (1 event, newest first)
          let lastMessage: {
            sender: string
            preview: string
            timestamp: string
          } | null = null
          let latestMessageId: string | null = null

          try {
            const [latest] = await fetchEventsPage<DmMessagePostedEvent>(
              CONTRACT, 'message_posted',
              {
                'payload.room_key.participant_a': rk.participant_a,
                'payload.room_key.participant_b': rk.participant_b,
              },
              { limit: 1, sort: 'desc' }
            )
            if (latest) {
              latestMessageId = latest.payload.message_id
              const preview = await resolvePreview(latest.payload.content)
              lastMessage = {
                sender: latest.payload.sender,
                preview,
                timestamp: latest.payload.timestamp,
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch latest message for room ${rkStr}:`, e)
          }

          return {
            roomKey: rk,
            roomKeyStr: rkStr,
            peer,
            createdAt: event.payload.timestamp,
            lastMessage,
            latestMessageId,
          }
        })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

export type RoomListItem = NonNullable<
  ReturnType<typeof useRoomList>['data']
>[number]

// ---------------------------------------------------------------------------
// Messages (paginated, newest first)
// ---------------------------------------------------------------------------

export function useDmMessages(roomKey: RoomKey | undefined) {
  const [allMessages, setAllMessages] = useState<Awaited<ReturnType<typeof parseDmMessage>>[]>([])
  const [hasMore, setHasMore] = useState(false)
  const offsetRef = useRef(0)
  const deletedIdsRef = useRef<Set<string>>(new Set())
  const isLoadingMoreRef = useRef(false)

  const participantA = roomKey?.participant_a
  const participantB = roomKey?.participant_b

  const swrResult = useSWR(
    roomKey ? `msg:dm-messages:${CONTRACT}:${roomKeyToString(roomKey)}` : null,
    async () => {
      if (!participantA || !participantB) return []

      const rkParams = {
        'payload.room_key.participant_a': participantA,
        'payload.room_key.participant_b': participantB,
      }

      offsetRef.current = 0
      deletedIdsRef.current = new Set()

      const deleted = await fetchAllEvents<DmMessageDeletedEvent>(
        CONTRACT, 'message_deleted', rkParams
      )
      deletedIdsRef.current = new Set(deleted.map((e) => e.payload.message_id))

      const posted = await fetchEventsPage<DmMessagePostedEvent>(
        CONTRACT, 'message_posted', rkParams,
        { limit: MESSAGE_PAGE_SIZE, offset: 0, sort: 'desc' }
      )

      setHasMore(posted.length === MESSAGE_PAGE_SIZE)
      offsetRef.current = posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )
      const messages = await Promise.all(visible.map(parseDmMessage))
      const sorted = messages.reverse()
      setAllMessages(sorted)
      return sorted
    },
    { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 15_000 }
  )

  const loadMore = useCallback(async () => {
    if (!participantA || !participantB || !hasMore || isLoadingMoreRef.current) return
    isLoadingMoreRef.current = true

    const rkParams = {
      'payload.room_key.participant_a': participantA,
      'payload.room_key.participant_b': participantB,
    }

    try {
      const posted = await fetchEventsPage<DmMessagePostedEvent>(
        CONTRACT, 'message_posted', rkParams,
        { limit: MESSAGE_PAGE_SIZE, offset: offsetRef.current, sort: 'desc' }
      )

      setHasMore(posted.length === MESSAGE_PAGE_SIZE)
      offsetRef.current += posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )
      const older = await Promise.all(visible.map(parseDmMessage))
      setAllMessages((prev) => [...older.reverse(), ...prev])
    } finally {
      isLoadingMoreRef.current = false
    }
  }, [participantA, participantB, hasMore])

  return {
    ...swrResult,
    data: allMessages.length > 0 ? allMessages : swrResult.data,
    loadMore,
    hasMore,
  }
}

export type ParsedDmMessage = Awaited<ReturnType<typeof parseDmMessage>>

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

export function useDmFees() {
  const { data: storage } = useDmStorage()
  return {
    messageFee: storage?.message_fee ? parseInt(storage.message_fee) : 0,
  }
}
