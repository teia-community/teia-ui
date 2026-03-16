/**
 * SWR hooks for fetching channel data from the Shadownet contract via TzKT.
 *
 * Update:
 * Channel list & Messages use TzKT events
 * Access checks (blocked, admin) use bigmap queries.
 * 
 * Might be changed during contract update
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { SHADOWNET_CHANNEL_CONTRACT } from '@constants'
import {
  fetchContractStorage,
  fetchContractEvents,
  fetchBigMapKeys,
  fetchBigMapValue,
} from '../shadownet-tzkt'
import type {
  AccessMode,
  Channel,
  ChannelMessagePayload,
  ChannelMetadata,
  ChannelContractStorage,
  ChannelCreatedEvent,
  ChannelConfiguredEvent,
  ChannelHiddenEvent,
  ChannelDeletedEvent,
  MessagePostedEvent,
  MessageDeletedEvent,
} from './channel-types'

const CONTRACT = SHADOWNET_CHANNEL_CONTRACT

export function parseAccessMode(
  mode: Channel['access_mode']
): AccessMode {
  if ('unrestricted' in mode) return 'unrestricted'
  if ('allowlist' in mode) return 'allowlist'
  if ('blocklist' in mode) return 'blocklist'
  return 'unrestricted'
}

export function ipfsToUrl(uri: string): string {
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

/** Fetch contract storage (bigmap IDs, fees, paused state). */
export function useChannelStorage() {
  return useSWR(
    `shadownet:channel-storage:${CONTRACT}`,
    () => fetchContractStorage<ChannelContractStorage>(CONTRACT),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Channel list
// ---------------------------------------------------------------------------

/** List all non-hidden channels with resolved IPFS metadata (event-based). */
export function useChannelList(viewerAddress?: string) {
  return useSWR(
    `shadownet:channel-list:${CONTRACT}`,
    async () => {
      // Fetch all event types in parallel
      const [created, configured, hidden, deleted, posted, msgDeleted] = await Promise.all([
        fetchContractEvents<ChannelCreatedEvent>(CONTRACT, 'channel_created'),
        fetchContractEvents<ChannelConfiguredEvent>(CONTRACT, 'channel_configured'),
        fetchContractEvents<ChannelHiddenEvent>(CONTRACT, 'channel_hidden'),
        fetchContractEvents<ChannelDeletedEvent>(CONTRACT, 'channel_deleted'),
        fetchContractEvents<MessagePostedEvent>(CONTRACT, 'message_posted'),
        fetchContractEvents<MessageDeletedEvent>(CONTRACT, 'message_deleted'),
      ])

      const hiddenIds = new Set(hidden.map((e) => e.payload.channel_id))
      const deletedIds = new Set(deleted.map((e) => e.payload.channel_id))
      const deletedMsgIds = new Set(msgDeleted.map((e) => e.payload.message_id))

      // Count messages per channel (excluding deleted) and track latest message ID from others
      const msgCounts: Record<string, number> = {}
      const latestMsgIds: Record<string, number> = {}
      for (const e of posted) {
        if (!deletedMsgIds.has(e.payload.message_id)) {
          const chId = e.payload.channel_id
          msgCounts[chId] = (msgCounts[chId] || 0) + 1
          const msgId = parseInt(e.payload.message_id)
          if (!latestMsgIds[chId] || msgId > latestMsgIds[chId]) {
            latestMsgIds[chId] = msgId
          }
        }
      }
      // Track latest message ID excluding the viewer's own messages (for unread dots)
      const latestOtherMsgIds: Record<string, number> = {}
      if (viewerAddress) {
        for (const e of posted) {
          if (!deletedMsgIds.has(e.payload.message_id) && e.payload.sender !== viewerAddress) {
            const chId = e.payload.channel_id
            const msgId = parseInt(e.payload.message_id)
            if (!latestOtherMsgIds[chId] || msgId > latestOtherMsgIds[chId]) {
              latestOtherMsgIds[chId] = msgId
            }
          }
        }
      }

      // Build latest access mode per channel from configure events
      const latestConfig: Record<string, ChannelConfiguredEvent> = {}
      for (const e of configured) {
        latestConfig[e.payload.channel_id] = e.payload
      }

      // Filter out hidden/deleted, then resolve IPFS metadata
      const visible = created.filter(
        (e) =>
          !hiddenIds.has(e.payload.channel_id) &&
          !deletedIds.has(e.payload.channel_id)
      )

      return Promise.all(
        visible.reverse().map(async (event) => {
          const p = event.payload
          const config = latestConfig[p.channel_id]
          const accessMode = config
            ? parseAccessMode(config.access_mode)
            : 'unrestricted'

          const metadataUri = p.metadata_uri
            ? bytesToString(p.metadata_uri)
            : ''
          let metadata: ChannelMetadata = {
            name: `Channel #${p.channel_id}`,
            description: '',
          }
          if (metadataUri.startsWith('ipfs://')) {
            try {
              metadata = await fetchIpfsJson<ChannelMetadata>(metadataUri)
            } catch (e) {
              console.warn(
                `Failed to fetch metadata for channel #${p.channel_id}:`,
                e
              )
            }
          }

          return {
            id: parseInt(p.channel_id),
            creator: p.creator,
            metadata_uri: p.metadata_uri,
            metadataUri,
            metadata,
            timestamp: p.timestamp,
            accessMode,
            message_count: String(msgCounts[p.channel_id] || 0),
            latestMessageId: latestMsgIds[p.channel_id] || 0,
            latestOtherMessageId: latestOtherMsgIds[p.channel_id] || 0,
            hidden: false,
            access_mode: (config?.access_mode || { unrestricted: '' }) as Channel['access_mode'],
            merkle_root: config?.merkle_root ?? null,
            merkle_uri: config?.merkle_uri ?? null,
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

/** 
 * Resolve allowlists from IPFS for allowlist channels.
 */
export function useChannelAllowlists(
  channels: ChannelListItem[] | undefined
) {
  const allowlistChannels = channels?.filter(
    (ch) => ch.accessMode === 'allowlist' && ch.merkle_uri
  )
  const key =
    allowlistChannels && allowlistChannels.length > 0
      ? `shadownet:channel-allowlists:${allowlistChannels.map((ch) => ch.id).join(',')}`
      : null

  return useSWR(
    key,
    async () => {
      if (!allowlistChannels) return {}
      const results: Record<number, string[]> = {}
      await Promise.all(
        allowlistChannels.map(async (ch) => {
          if (!ch.merkle_uri) return
          const decoded = bytesToString(ch.merkle_uri)
          if (decoded.startsWith('ipfs://')) {
            try {
              results[ch.id] = await fetchIpfsJson<string[]>(decoded)
            } catch (e) {
              console.warn(`Failed to fetch allowlist for channel #${ch.id}:`, e)
            }
          }
        })
      )
      return results
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Single channel
// ---------------------------------------------------------------------------

/** Fetch a single channel by ID with resolved IPFS metadata. */
export function useChannel(channelId: number | undefined) {
  return useSWR(
    channelId !== undefined
      ? `shadownet:channel:${CONTRACT}:${channelId}`
      : null,
    async () => {
      if (channelId === undefined) return null
      const raw = await fetchBigMapValue<Channel>(
        CONTRACT,
        'channels',
        String(channelId)
      )
      if (!raw) return null

      const metadataUri = raw.metadata_uri
        ? bytesToString(raw.metadata_uri)
        : ''
      let metadata: ChannelMetadata = {
        name: `Channel #${channelId}`,
        description: '',
      }
      if (metadataUri.startsWith('ipfs://')) {
        try {
          metadata = await fetchIpfsJson<ChannelMetadata>(metadataUri)
        } catch (e) {
          console.warn(`Failed to fetch metadata for channel #${channelId}:`, e)
        }
      }

      // Resolve allowlist addresses from IPFS
      const merkleUriDecoded = raw.merkle_uri
        ? bytesToString(raw.merkle_uri)
        : ''
      let allowlist: string[] | undefined
      if (merkleUriDecoded.startsWith('ipfs://')) {
        try {
          allowlist = await fetchIpfsJson<string[]>(merkleUriDecoded)
        } catch (e) {
          console.warn(`Failed to fetch allowlist for channel #${channelId}:`, e)
        }
      }

      return {
        ...raw,
        id: channelId,
        metadataUri,
        metadata,
        accessMode: parseAccessMode(raw.access_mode),
        allowlist,
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

export type ChannelDetail = NonNullable<
  NonNullable<ReturnType<typeof useChannel>['data']>
>

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** Fetch messages for a channel via events, with content decoded from bytes. */
export function useChannelMessages(channelId: number | undefined) {
  return useSWR(
    channelId !== undefined
      ? `shadownet:channel-messages:${CONTRACT}:${channelId}`
      : null,
    async () => {
      if (channelId === undefined) return []

      // Fetch posted and deleted events in parallel
      const [posted, deleted] = await Promise.all([
        fetchContractEvents<MessagePostedEvent>(CONTRACT, 'message_posted', {
          'payload.channel_id': String(channelId),
        }),
        fetchContractEvents<MessageDeletedEvent>(CONTRACT, 'message_deleted', {
          'payload.channel_id': String(channelId),
        }),
      ])

      const deletedIds = new Set(deleted.map((e) => e.payload.message_id))

      const visible = posted.filter(
        (e) => !deletedIds.has(e.payload.message_id)
      )

      return Promise.all(visible.map(async (event) => {
        const p = event.payload
        const raw = p.content ? bytesToString(p.content) : ''
        let parsed: ChannelMessagePayload | null = null
        const isIpfs = raw.startsWith('ipfs://')

        if (isIpfs) {
          try {
            const json = await fetchIpfsJson<ChannelMessagePayload>(raw)
            if (json.type === 'teia-channel-message') parsed = json
          } catch (e) {
            console.error(`IPFS fetch failed for message #${p.message_id}:`, e)
          }
        } else {
          try {
            const json = JSON.parse(raw)
            if (json.type === 'teia-channel-message') parsed = json
          } catch (e) {
            console.error(`Failed to parse message #${p.message_id}:`, e)
          }
        }

        return {
          id: parseInt(p.message_id),
          channel_id: p.channel_id,
          sender: p.sender,
          parent_id: p.parent_id,
          timestamp: p.timestamp,
          content: parsed ? parsed.content : raw,
          payload: parsed,
          isIpfs,
        }
      }))
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

export type ParsedChannelMessage = NonNullable<
  ReturnType<typeof useChannelMessages>['data']
>[number]

// ---------------------------------------------------------------------------
// Blocklist check
// ---------------------------------------------------------------------------

/** Check if an address is blocked in a channel. */
export function useIsBlocked(
  channelId: number | undefined,
  address: string | undefined
) {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.blocked

  return useSWR(
    bigmapId && channelId !== undefined && address
      ? `shadownet:channel-blocked:${bigmapId}:${channelId}:${address}`
      : null,
    async () => {
      if (!bigmapId || channelId === undefined || !address) return false
      const entries = await fetchBigMapKeys(bigmapId, {
        'key.channel_id': String(channelId),
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

/** Fetch admin addresses for a channel. */
export function useChannelAdmins(channelId: number | undefined) {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.channel_admins

  return useSWR(
    bigmapId && channelId !== undefined
      ? `shadownet:channel-admins:${bigmapId}:${channelId}`
      : null,
    async () => {
      if (!bigmapId || channelId === undefined) return []
      const entries = await fetchBigMapKeys<unknown, { channel_id: string; address: string }>(bigmapId, {
        'key.channel_id': String(channelId),
      })
      return entries.map((e) => e.key.address)
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

/** Check if an address is a channel admin. */
export function useIsChannelAdmin(
  channelId: number | undefined,
  address: string | undefined
) {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.channel_admins

  return useSWR(
    bigmapId && channelId !== undefined && address
      ? `shadownet:channel-admin:${bigmapId}:${channelId}:${address}`
      : null,
    async () => {
      if (!bigmapId || channelId === undefined || !address) return false
      const entries = await fetchBigMapKeys(bigmapId, {
        'key.channel_id': String(channelId),
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

/** Get channel fees from storage. */
export function useChannelFees() {
  const { data: storage } = useChannelStorage()
  return {
    messageFee: storage?.message_fee ? parseInt(storage.message_fee) : 0,
    channelFee: storage?.channel_fee ? parseInt(storage.channel_fee) : 0,
    paused: storage?.paused ?? false,
  }
}
