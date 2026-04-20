/**
 * SWR hooks for fetching channel data via TzKT events.
 *
 * Uses server-side payload filtering on all event queries.
 * Messages are paginated (newest first, 50 per page).
 */
import useSWR from 'swr'
import { useCallback, useRef, useState } from 'react'
import { bytesToString } from '@taquito/utils'
import { MESSAGING_CHANNEL_CONTRACT } from '@constants'
import {
  fetchAllEvents,
  fetchEventsPage,
  fetchContractStorage,
  fetchBigMapValue,
  fetchBigMapKeys,
} from './api'
import { fetchMsgIpfsJson } from './ipfs'
import type {
  ChannelCreatedEvent,
  ChannelConfiguredEvent,
  ChannelHiddenEvent,
  ChannelDeletedEvent,
  MessagePostedEvent,
  MessageDeletedEvent,
  ChannelContractStorage,
  ChannelMetadata,
  ChannelMessagePayload,
  ChannelAccessMode,
  TzktEvent,
} from './channel-types'

const CONTRACT = MESSAGING_CHANNEL_CONTRACT
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

async function resolveMetadata(
  metadataHex: string,
  channelId: string
): Promise<ChannelMetadata> {
  const uri = decodeBytes(metadataHex)
  if (uri.startsWith('ipfs://')) {
    try {
      return await fetchMsgIpfsJson<ChannelMetadata>(uri)
    } catch (e) {
      console.warn(`Failed to fetch metadata for channel #${channelId}:`, e)
    }
  }
  return { type: 'teia-channel', version: 1, name: `Channel #${channelId}`, description: '' }
}

async function parseMessage(event: TzktEvent<MessagePostedEvent>) {
  const p = event.payload
  const raw = decodeBytes(p.content)
  const isIpfs = raw.startsWith('ipfs://')
  let parsed: ChannelMessagePayload | null = null

  try {
    if (isIpfs) {
      const json = await fetchMsgIpfsJson<ChannelMessagePayload>(raw)
      if (json.type === 'teia-channel-message') parsed = json
    } else if (raw) {
      const json = JSON.parse(raw)
      if (json.type === 'teia-channel-message') parsed = json
    }
  } catch (e) {
    console.warn(`Failed to parse message #${p.message_id}:`, e)
  }

  return {
    id: p.message_id,
    channelId: p.channel_id,
    sender: p.sender,
    parentId: p.parent_id,
    timestamp: p.timestamp,
    content: parsed?.content ?? raw,
    embeds: parsed?.embeds ?? [],
    isIpfs,
  }
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function useChannelStorage() {
  return useSWR(
    `msg:channel-storage:${CONTRACT}`,
    () => fetchContractStorage<ChannelContractStorage>(CONTRACT),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Channel list
// ---------------------------------------------------------------------------

export function useChannelList(viewerAddress?: string) {
  return useSWR(
    `msg:channel-list:${CONTRACT}:${viewerAddress ?? ''}`,
    async () => {
      const [created, configured, hidden, deleted] = await Promise.all([
        fetchAllEvents<ChannelCreatedEvent>(CONTRACT, 'channel_created'),
        fetchAllEvents<ChannelConfiguredEvent>(CONTRACT, 'channel_configured'),
        fetchAllEvents<ChannelHiddenEvent>(CONTRACT, 'channel_hidden'),
        fetchAllEvents<ChannelDeletedEvent>(CONTRACT, 'channel_deleted'),
      ])

      const hiddenIds = new Set(hidden.map((e) => e.payload.channel_id))
      const deletedIds = new Set(deleted.map((e) => e.payload.channel_id))

      const latestConfig: Record<string, ChannelConfiguredEvent> = {}
      for (const e of configured) {
        latestConfig[e.payload.channel_id] = e.payload
      }

      const visible = created.filter(
        (e) =>
          !hiddenIds.has(e.payload.channel_id) &&
          !deletedIds.has(e.payload.channel_id)
      )

      return Promise.all(
        visible.reverse().map(async (event) => {
          const p = event.payload
          const config = latestConfig[p.channel_id]
          const accessMode: ChannelAccessMode = config
            ? (Object.keys(config.access_mode)[0] as ChannelAccessMode) ?? 'unrestricted'
            : 'unrestricted'

          const metadata = await resolveMetadata(p.metadata_uri, p.channel_id)

          return {
            id: p.channel_id,
            creator: p.creator,
            createdAt: p.timestamp,
            metadata,
            accessMode,
            merkleRoot: config?.merkle_root ?? null,
            merkleUri: config?.merkle_uri ?? null,
          }
        })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

export type ChannelListItem = NonNullable<
  ReturnType<typeof useChannelList>['data']
>[number]

// ---------------------------------------------------------------------------
// Single channel
// ---------------------------------------------------------------------------

export function useChannel(channelId: string | undefined) {
  return useSWR(
    channelId ? `msg:channel:${CONTRACT}:${channelId}` : null,
    async () => {
      if (!channelId) return null
      const raw = await fetchBigMapValue<Record<string, unknown>>(
        CONTRACT,
        'channels',
        channelId
      )
      if (!raw) return null

      const metadataHex = (raw.metadata_uri as string) ?? ''
      const metadata = await resolveMetadata(metadataHex, channelId)

      const merkleUriDecoded = raw.merkle_uri
        ? decodeBytes(raw.merkle_uri as string)
        : ''
      let allowlist: string[] | undefined
      if (merkleUriDecoded.startsWith('ipfs://')) {
        try {
          allowlist = await fetchMsgIpfsJson<string[]>(merkleUriDecoded)
        } catch (e) {
          console.warn(`Failed to fetch allowlist for channel #${channelId}:`, e)
        }
      }

      return {
        id: channelId,
        creator: raw.creator as string,
        metadata,
        accessMode: (Object.keys(raw.access_mode as object)[0] as ChannelAccessMode) ?? 'unrestricted',
        allowlist,
        merkleRoot: (raw.merkle_root as string) ?? null,
        merkleUri: merkleUriDecoded || null,
        raw,
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

export type ChannelDetail = NonNullable<
  NonNullable<ReturnType<typeof useChannel>['data']>
>

// ---------------------------------------------------------------------------
// Messages (paginated, newest first)
// ---------------------------------------------------------------------------

export function useChannelMessages(channelId: string | undefined) {
  const [allMessages, setAllMessages] = useState<Awaited<ReturnType<typeof parseMessage>>[]>([])
  const [hasMore, setHasMore] = useState(false)
  const offsetRef = useRef(0)
  const deletedIdsRef = useRef<Set<string>>(new Set())
  const isLoadingMoreRef = useRef(false)

  const swrResult = useSWR(
    channelId ? `msg:channel-messages:${CONTRACT}:${channelId}` : null,
    async () => {
      offsetRef.current = 0
      deletedIdsRef.current = new Set()

      const deleted = await fetchAllEvents<MessageDeletedEvent>(
        CONTRACT, 'message_deleted',
        { 'payload.channel_id': channelId! }
      )
      deletedIdsRef.current = new Set(deleted.map((e) => e.payload.message_id))

      const posted = await fetchEventsPage<MessagePostedEvent>(
        CONTRACT, 'message_posted',
        { 'payload.channel_id': channelId! },
        { limit: MESSAGE_PAGE_SIZE, offset: 0, sort: 'desc' }
      )

      setHasMore(posted.length === MESSAGE_PAGE_SIZE)
      offsetRef.current = posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )
      const messages = await Promise.all(visible.map(parseMessage))
      const sorted = messages.reverse()
      setAllMessages(sorted)
      return sorted
    },
    { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 15_000 }
  )

  const loadMore = useCallback(async () => {
    if (!channelId || !hasMore || isLoadingMoreRef.current) return
    isLoadingMoreRef.current = true

    try {
      const posted = await fetchEventsPage<MessagePostedEvent>(
        CONTRACT, 'message_posted',
        { 'payload.channel_id': channelId },
        { limit: MESSAGE_PAGE_SIZE, offset: offsetRef.current, sort: 'desc' }
      )

      setHasMore(posted.length === MESSAGE_PAGE_SIZE)
      offsetRef.current += posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )
      const older = await Promise.all(visible.map(parseMessage))
      setAllMessages((prev) => [...older.reverse(), ...prev])
    } finally {
      isLoadingMoreRef.current = false
    }
  }, [channelId, hasMore])

  return {
    ...swrResult,
    data: allMessages.length > 0 ? allMessages : swrResult.data,
    loadMore,
    hasMore,
  }
}

export type ParsedChannelMessage = Awaited<ReturnType<typeof parseMessage>>

// ---------------------------------------------------------------------------
// Blocklist check
// ---------------------------------------------------------------------------

export function useIsBlocked(
  channelId: string | undefined,
  address: string | undefined
) {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.blocked

  return useSWR(
    bigmapId && channelId && address
      ? `msg:channel-blocked:${bigmapId}:${channelId}:${address}`
      : null,
    async () => {
      if (!bigmapId || !channelId || !address) return false
      const entries = await fetchBigMapKeys(bigmapId, {
        'key.channel_id': channelId,
        'key.address': address,
        limit: '1',
      })
      return entries.length > 0
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

// ---------------------------------------------------------------------------
// Admin checks
// ---------------------------------------------------------------------------

export function useChannelAdmins(channelId: string | undefined) {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.channel_admins

  return useSWR(
    bigmapId && channelId
      ? `msg:channel-admins:${bigmapId}:${channelId}`
      : null,
    async () => {
      if (!bigmapId || !channelId) return []
      const entries = await fetchBigMapKeys<unknown>(bigmapId, {
        'key.channel_id': channelId,
      })
      return entries.map((e) => (e.key as { address: string }).address)
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

export function useIsChannelAdmin(
  channelId: string | undefined,
  address: string | undefined
) {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.channel_admins

  return useSWR(
    bigmapId && channelId && address
      ? `msg:channel-admin:${bigmapId}:${channelId}:${address}`
      : null,
    async () => {
      if (!bigmapId || !channelId || !address) return false
      const entries = await fetchBigMapKeys(bigmapId, {
        'key.channel_id': channelId,
        'key.address': address,
        limit: '1',
      })
      return entries.length > 0
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

