/**
 * SWR hooks for channels_v2 data via TzKT events and bigmap reads.
 *
 * Channels support three access modes (unrestricted, allowlist, closed),
 * DMs (closed channels with kind='dm'), edit history, and hide/moderation.
 */
import useSWR from 'swr'
import { useCallback, useRef, useState } from 'react'
import { bytesToString } from '@taquito/utils'
import { CHANNELS_V2_CONTRACT } from '@constants'
import {
  fetchAllEvents,
  fetchEventsPage,
  fetchBigMapValue,
  fetchBigMapValuesBulk,
} from './api'
import { fetchMsgIpfsJson } from './ipfs'
import type {
  ChannelCreatedEvent,
  ChannelConfiguredEvent,
  ChannelHiddenEvent,
  ChannelUpdatedEvent,
  ChannelAdminsUpdatedEvent,
  MessagePostedEvent,
  MessageDeletedEvent,
  ChannelMetadata,
  ChannelMessagePayload,
  ChannelAccessMode,
  ChannelMessageVersion,
  MessageBigmapRow,
  MessageHistoryRow,
  TzktEvent,
} from './channel-types'

const CONTRACT = CHANNELS_V2_CONTRACT
const MESSAGE_PAGE_SIZE = 50

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeBytes(hex: string | null | undefined): string {
  try {
    return hex ? bytesToString(hex) : ''
  } catch {
    return ''
  }
}

async function resolveMetadata(
  metadataHex: string | null | undefined,
  channelId: string
): Promise<ChannelMetadata> {
  const uri = decodeBytes(metadataHex)
  if (uri.startsWith('ipfs://')) {
    try {
      const fetched = await fetchMsgIpfsJson<Partial<ChannelMetadata>>(uri)
      return {
        type: 'teia-channel',
        version: 1,
        kind: fetched.kind ?? 'channel',
        name: fetched.name ?? `Channel #${channelId}`,
        description: fetched.description ?? '',
        image: fetched.image,
        participants: fetched.participants,
      }
    } catch (e) {
      console.warn(`Failed to fetch metadata for channel #${channelId}:`, e)
    }
  }
  return {
    type: 'teia-channel',
    version: 1,
    kind: 'channel',
    name: `Channel #${channelId}`,
    description: '',
  }
}

async function parseMessage(
  event: TzktEvent<MessagePostedEvent>,
  row: MessageBigmapRow
) {
  const p = event.payload
  const raw = decodeBytes(row.content)
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
    sender: row.sender,
    parentId: row.parent_id,
    timestamp: row.timestamp ?? p.timestamp,
    hidden: Boolean(row.hidden),
    version: parseInt(row.version ?? '1') || 1,
    content: parsed?.content ?? raw,
    embeds: parsed?.embeds ?? [],
    isIpfs,
  }
}

function accessModeFromMichelson(
  variant: Record<string, unknown> | undefined
): ChannelAccessMode {
  if (!variant) return 'unrestricted'
  return (Object.keys(variant)[0] as ChannelAccessMode) ?? 'unrestricted'
}

// ---------------------------------------------------------------------------
// Public channel list (drops DMs and hidden channels)
// ---------------------------------------------------------------------------

export function useChannelList() {
  return useSWR(
    `msg:channel-list:${CONTRACT}`,
    async () => {
      const [created, configured, updated, hidden] = await Promise.all([
        fetchAllEvents<ChannelCreatedEvent>(CONTRACT, 'channel_created'),
        fetchAllEvents<ChannelConfiguredEvent>(CONTRACT, 'channel_configured'),
        fetchAllEvents<ChannelUpdatedEvent>(CONTRACT, 'channel_updated'),
        fetchAllEvents<ChannelHiddenEvent>(CONTRACT, 'channel_hidden'),
      ])

      const hiddenIds = new Set(hidden.map((e) => e.payload.channel_id))

      const latestConfig: Record<string, ChannelConfiguredEvent> = {}
      for (const e of configured) {
        latestConfig[e.payload.channel_id] = e.payload
      }

      const latestMetadataUri: Record<string, string> = {}
      for (const e of updated) {
        latestMetadataUri[e.payload.channel_id] = e.payload.metadata_uri
      }

      const visible = created.filter((e) => !hiddenIds.has(e.payload.channel_id))

      const items = await Promise.all(
        visible.reverse().map(async (event) => {
          const p = event.payload
          const config = latestConfig[p.channel_id]
          const accessMode = accessModeFromMichelson(
            config?.access_mode ?? p.access_mode
          )
          const metadataUri = latestMetadataUri[p.channel_id] ?? p.metadata_uri
          const metadata = await resolveMetadata(metadataUri, p.channel_id)

          return {
            id: p.channel_id,
            creator: p.creator,
            createdAt: p.timestamp,
            metadata,
            accessMode,
            merkleRoot: config?.merkle_root ?? p.merkle_root ?? null,
            merkleUri: decodeBytes(config?.merkle_uri ?? p.merkle_uri) || null,
          }
        })
      )

      return items.filter((c) => c.metadata.kind !== 'dm')
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

export type ChannelListItem = NonNullable<
  ReturnType<typeof useChannelList>['data']
>[number]

// ---------------------------------------------------------------------------
// Inbox: channels I created or am currently admin of (DMs + channels)
// ---------------------------------------------------------------------------

export function useMyInbox(viewerAddress: string | undefined) {
  return useSWR(
    viewerAddress ? `msg:inbox:${CONTRACT}:${viewerAddress}` : null,
    async () => {
      if (!viewerAddress) return []

      const [created, adminsUpdated, hidden, configured, updated] =
        await Promise.all([
          fetchAllEvents<ChannelCreatedEvent>(CONTRACT, 'channel_created'),
          fetchAllEvents<ChannelAdminsUpdatedEvent>(
            CONTRACT,
            'channel_admins_updated'
          ),
          fetchAllEvents<ChannelHiddenEvent>(CONTRACT, 'channel_hidden'),
          fetchAllEvents<ChannelConfiguredEvent>(CONTRACT, 'channel_configured'),
          fetchAllEvents<ChannelUpdatedEvent>(CONTRACT, 'channel_updated'),
        ])

      const hiddenIds = new Set(hidden.map((e) => e.payload.channel_id))

      const adminsByChannel: Record<string, Set<string>> = {}
      for (const e of created) {
        const cid = e.payload.channel_id
        if (!adminsByChannel[cid]) adminsByChannel[cid] = new Set()
        for (const a of e.payload.admins ?? []) adminsByChannel[cid].add(a)
      }
      for (const e of adminsUpdated) {
        const cid = e.payload.channel_id
        if (!adminsByChannel[cid]) adminsByChannel[cid] = new Set()
        for (const a of e.payload.to_add ?? []) adminsByChannel[cid].add(a)
        for (const a of e.payload.to_remove ?? []) adminsByChannel[cid].delete(a)
      }

      const latestConfig: Record<string, ChannelConfiguredEvent> = {}
      for (const e of configured) {
        latestConfig[e.payload.channel_id] = e.payload
      }

      const latestMetadataUri: Record<string, string> = {}
      for (const e of updated) {
        latestMetadataUri[e.payload.channel_id] = e.payload.metadata_uri
      }

      const myChannels = created.filter((e) => {
        const cid = e.payload.channel_id
        if (hiddenIds.has(cid)) return false
        if (e.payload.creator === viewerAddress) return true
        return adminsByChannel[cid]?.has(viewerAddress) ?? false
      })

      return Promise.all(
        myChannels.reverse().map(async (event) => {
          const p = event.payload
          const config = latestConfig[p.channel_id]
          const accessMode = accessModeFromMichelson(
            config?.access_mode ?? p.access_mode
          )
          const metadataUri = latestMetadataUri[p.channel_id] ?? p.metadata_uri
          const metadata = await resolveMetadata(metadataUri, p.channel_id)
          return {
            id: p.channel_id,
            creator: p.creator,
            createdAt: p.timestamp,
            metadata,
            accessMode,
            merkleRoot: config?.merkle_root ?? p.merkle_root ?? null,
            merkleUri: decodeBytes(config?.merkle_uri ?? p.merkle_uri) || null,
            isCreator: p.creator === viewerAddress,
            isAdmin: adminsByChannel[p.channel_id]?.has(viewerAddress) ?? false,
          }
        })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

export type InboxItem = NonNullable<ReturnType<typeof useMyInbox>['data']>[number]

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
      let merkleUsers: string[] | undefined
      if (merkleUriDecoded.startsWith('ipfs://')) {
        try {
          merkleUsers = await fetchMsgIpfsJson<string[]>(merkleUriDecoded)
        } catch (e) {
          console.warn(`Failed to fetch merkle list for channel #${channelId}:`, e)
        }
      }

      return {
        id: channelId,
        creator: raw.creator as string,
        metadata,
        accessMode: accessModeFromMichelson(
          raw.access_mode as Record<string, unknown>
        ),
        merkleUsers,
        merkleRoot: (raw.merkle_root as string) ?? null,
        merkleUri: merkleUriDecoded || null,
        hidden: Boolean(raw.hidden),
        messageCount: Number(raw.message_count ?? 0),
        createdAt: (raw.timestamp as string) ?? null,
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
  const offsetRef = useRef(0)
  const hasMoreRef = useRef(false)
  const [hasMore, setHasMore] = useState(false)
  const deletedIdsRef = useRef<Set<string>>(new Set())
  const isLoadingMoreRef = useRef(false)

  const cacheKey = channelId
    ? `msg:channel-messages:${CONTRACT}:${channelId}`
    : null

  const swrResult = useSWR(
    cacheKey,
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

      const more = posted.length === MESSAGE_PAGE_SIZE
      hasMoreRef.current = more
      setHasMore(more)
      offsetRef.current = posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )

      const ids = visible.map((e) => e.payload.message_id)
      const rows = await fetchBigMapValuesBulk<MessageBigmapRow>(
        CONTRACT,
        'messages',
        ids
      )

      const messages = await Promise.all(
        visible
          .filter((e) => rows.has(e.payload.message_id))
          .map((e) => parseMessage(e, rows.get(e.payload.message_id)!))
      )
      return messages.reverse()
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )

  const loadMore = useCallback(async () => {
    if (!channelId || !hasMoreRef.current || isLoadingMoreRef.current) return
    isLoadingMoreRef.current = true

    try {
      const posted = await fetchEventsPage<MessagePostedEvent>(
        CONTRACT, 'message_posted',
        { 'payload.channel_id': channelId },
        { limit: MESSAGE_PAGE_SIZE, offset: offsetRef.current, sort: 'desc' }
      )

      const more = posted.length === MESSAGE_PAGE_SIZE
      hasMoreRef.current = more
      setHasMore(more)
      offsetRef.current += posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )
      const ids = visible.map((e) => e.payload.message_id)
      const rows = await fetchBigMapValuesBulk<MessageBigmapRow>(
        CONTRACT,
        'messages',
        ids
      )
      const older = await Promise.all(
        visible
          .filter((e) => rows.has(e.payload.message_id))
          .map((e) => parseMessage(e, rows.get(e.payload.message_id)!))
      )
      const olderSorted = older.reverse()

      swrResult.mutate(
        (current) => [...olderSorted, ...(current ?? [])],
        { revalidate: false }
      )
    } finally {
      isLoadingMoreRef.current = false
    }
  }, [channelId, swrResult])

  return {
    ...swrResult,
    loadMore,
    hasMore,
  }
}

export type ParsedChannelMessage = Awaited<ReturnType<typeof parseMessage>>

// ---------------------------------------------------------------------------
// Message edit history
// ---------------------------------------------------------------------------

export function useMessageHistory(
  messageId: string | undefined,
  version: number
) {
  const shouldFetch = Boolean(messageId) && version > 1 && Boolean(CONTRACT)
  return useSWR<ChannelMessageVersion[]>(
    shouldFetch
      ? `msg:channel-message-history:${CONTRACT}:${messageId}:${version}`
      : null,
    async () => {
      const url = new URL(
        `${import.meta.env.VITE_TZKT_API}/v1/contracts/${CONTRACT}/bigmaps/message_history/keys`
      )
      url.searchParams.set('active', 'true')
      url.searchParams.set('key.nat_0', String(messageId))
      url.searchParams.set('select', 'key,value')
      url.searchParams.set('limit', String(Math.max(version - 1, 1)))

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
      const rows: {
        key: { nat_0: string; nat_1: string }
        value: MessageHistoryRow
      }[] = await res.json()

      const versions: ChannelMessageVersion[] = await Promise.all(
        rows.map(async (row) => {
          const v = row.key.nat_1
          const raw = decodeBytes(row.value.content)
          const isIpfs = raw.startsWith('ipfs://')
          let content = raw
          try {
            if (isIpfs) {
              const json = await fetchMsgIpfsJson<ChannelMessagePayload>(raw)
              if (json.type === 'teia-channel-message') content = json.content
            } else if (raw) {
              const json = JSON.parse(raw)
              if (json.type === 'teia-channel-message') content = json.content
            }
          } catch (e) {
            console.warn(
              `Failed to parse history v${v} of message #${messageId}:`,
              e
            )
          }
          return {
            version: parseInt(String(v)) || 0,
            timestamp: row.value.timestamp,
            content,
            isIpfs,
          }
        })
      )

      return versions.sort((a, b) => b.version - a.version)
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Admin checks
// ---------------------------------------------------------------------------

export function useChannelAdmins(channelId: string | undefined) {
  return useSWR(
    channelId ? `msg:channel-admins:${CONTRACT}:${channelId}` : null,
    async () => {
      if (!channelId) return []
      const value = await fetchBigMapValue<string[]>(
        CONTRACT,
        'channel_admins',
        channelId
      )
      return value ?? []
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

export function useIsChannelAdmin(
  channelId: string | undefined,
  address: string | undefined
) {
  const { data: admins } = useChannelAdmins(channelId)
  return {
    data: address && admins ? admins.includes(address) : false,
  }
}

// ---------------------------------------------------------------------------
// Ban checks
// ---------------------------------------------------------------------------

export function useIsBannedFromChannel(
  channelId: string | undefined,
  address: string | undefined
) {
  return useSWR<boolean>(
    channelId && address
      ? `msg:channel-banned:${CONTRACT}:${channelId}:${address}`
      : null,
    async () => {
      if (!channelId || !address) return false
      const url = new URL(
        `${import.meta.env.VITE_TZKT_API}/v1/contracts/${CONTRACT}/bigmaps/channel_banned/keys`
      )
      url.searchParams.set('active', 'true')
      url.searchParams.set('key.nat', channelId)
      url.searchParams.set('key.address', address)
      url.searchParams.set('limit', '1')

      const res = await fetch(url.toString())
      if (!res.ok) return false
      const rows = await res.json()
      return Array.isArray(rows) && rows.length > 0
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

export function useIsContractBanned(address: string | undefined) {
  return useSWR<boolean>(
    address && CONTRACT
      ? `msg:channel-contract-banned:${CONTRACT}:${address}`
      : null,
    async () => {
      if (!address) return false
      const row = await fetchBigMapValue<unknown>(CONTRACT, 'banned', address)
      return row !== null
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}
