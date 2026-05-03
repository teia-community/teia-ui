/**
 * SWR hooks for channels data via TzKT events and bigmap reads.
 *
 * group/public channels based on the `kind` field in the IPFS metadata.
 */
import useSWR from 'swr'
import { useCallback, useRef, useState } from 'react'
import { bytesToString } from '@taquito/utils'
import { MESSAGING_CHANNELS_V2_CONTRACT } from '@constants'
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
  TzktEvent,
} from './channel-types'

const CONTRACT = MESSAGING_CHANNELS_V2_CONTRACT
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

/**
 * Raw shape of a row in the `messages` bigmap (TzKT decoded).
 * `content` is hex-encoded bytes containing either an IPFS URI or a JSON string.
 */
interface MessageBigmapRow {
  channel_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

async function parseMessage(
  event: TzktEvent<MessagePostedEvent>,
  contentHex: string
) {
  const p = event.payload
  const raw = decodeBytes(contentHex)
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

/**
 * Fetch the `content` bytes for a batch of message events from the messages
 * bigmap.
 */
async function fetchMessageContents(
  events: TzktEvent<MessagePostedEvent>[]
): Promise<Map<string, string>> {
  const ids = events.map((e) => e.payload.message_id)
  const rows = await fetchBigMapValuesBulk<MessageBigmapRow>(
    CONTRACT,
    'messages',
    ids
  )
  const out = new Map<string, string>()
  for (const [id, row] of rows.entries()) {
    if (row?.content) out.set(id, row.content)
  }
  return out
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

      // Latest metadata_uri per channel: events arrive ascending (id-sorted),
      // so the last write wins.
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

      // Replay admin events to compute the current admin set per channel.
      // Seed from `channel_created.admins` first (initial admins set at creation),
      // then apply incremental updates from `channel_admins_updated`.
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

      // Latest metadata_uri per channel: events arrive ascending (id-sorted),
      // so the last write wins.
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
  const [allMessages, setAllMessages] = useState<
    Awaited<ReturnType<typeof parseMessage>>[]
  >([])
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
      const contents = await fetchMessageContents(visible)
      const messages = await Promise.all(
        visible
          .filter((e) => contents.has(e.payload.message_id))
          .map((e) => parseMessage(e, contents.get(e.payload.message_id)!))
      )
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
      const contents = await fetchMessageContents(visible)
      const older = await Promise.all(
        visible
          .filter((e) => contents.has(e.payload.message_id))
          .map((e) => parseMessage(e, contents.get(e.payload.message_id)!))
      )
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
// Admin checks
// ---------------------------------------------------------------------------

/**
 * Read the admin set for a channel from the `channel_admins` bigmap.
 * The bigmap is keyed by channel_id (nat) with value `set[address]`.
 */
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
