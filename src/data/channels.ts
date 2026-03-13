/**
 * SWR hooks for fetching channel data from the Shadownet contract via TzKT.
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { SHADOWNET_CHANNEL_CONTRACT } from '@constants'
import { CIDToURL } from '@utils/index'
import {
  fetchContractStorage,
  fetchBigMapKeys,
  fetchBigMapValue,
} from './shadownet-tzkt'
import type {
  AccessMode,
  Channel,
  ChannelMessage,
  ChannelMessagePayload,
  ChannelMetadata,
  ChannelContractStorage,
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

/** Convert an ipfs:// URI to a gateway URL for display.
 *  Shadownet content isn't on the teia CDN cache, so fall back to ipfs.io. */
export function ipfsToUrl(uri: string): string {
  const cid = uri.replace('ipfs://', '')
  const gw = import.meta.env.VITE_IPFS_DEFAULT_GATEWAY
  return CIDToURL(cid, gw === 'CDN' ? 'IPFS' : gw, { size: 'raw' })
}

async function fetchIpfsJson<T>(uri: string): Promise<T> {
  const res = await fetch(ipfsToUrl(uri))
  if (!res.ok) throw new Error(`IPFS fetch failed: ${res.status}`)
  return res.json()
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

/** List all non-hidden channels with resolved IPFS metadata. */
export function useChannelList() {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.channels

  return useSWR(
    bigmapId ? `shadownet:channel-list:${bigmapId}` : null,
    async () => {
      if (!bigmapId) return []
      const entries = await fetchBigMapKeys<Channel>(bigmapId, {
        'value.hidden': 'false',
        'sort.desc': 'id',
        limit: '100',
      })

      return Promise.all(
        entries.map(async (entry) => {
          const metadataUri = entry.value.metadata_uri
            ? bytesToString(entry.value.metadata_uri)
            : ''
          let metadata: ChannelMetadata = {
            name: `Channel #${entry.key}`,
            description: '',
          }
          if (metadataUri.startsWith('ipfs://')) {
            try {
              metadata = await fetchIpfsJson<ChannelMetadata>(metadataUri)
            } catch (e) {
              console.warn(`Failed to fetch metadata for channel #${entry.key}:`, e)
            }
          }

          const accessMode = parseAccessMode(entry.value.access_mode)

          // Resolve allowlist from IPFS for allowlist channels
          let allowlist: string[] | undefined
          if (accessMode === 'allowlist' && entry.value.merkle_uri) {
            const merkleUriDecoded = bytesToString(entry.value.merkle_uri)
            if (merkleUriDecoded.startsWith('ipfs://')) {
              try {
                allowlist = await fetchIpfsJson<string[]>(merkleUriDecoded)
              } catch (e) {
                console.warn(`Failed to fetch allowlist for channel #${entry.key}:`, e)
              }
            }
          }

          return {
            ...entry.value,
            id: parseInt(entry.key),
            metadataUri,
            metadata,
            accessMode,
            allowlist,
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

/** Fetch messages for a channel, with content decoded from bytes. */
export function useChannelMessages(channelId: number | undefined) {
  const { data: storage } = useChannelStorage()
  const bigmapId = storage?.messages

  return useSWR(
    bigmapId && channelId !== undefined
      ? `shadownet:channel-messages:${bigmapId}:${channelId}`
      : null,
    async () => {
      if (!bigmapId || channelId === undefined) return []
      const entries = await fetchBigMapKeys<ChannelMessage>(bigmapId, {
        'value.channel_id': String(channelId),
        'sort.asc': 'id',
        limit: '200',
      })

      return Promise.all(entries.map(async (entry) => {
        const raw = entry.value.content ? bytesToString(entry.value.content) : ''
        let parsed: ChannelMessagePayload | null = null
        const isIpfs = raw.startsWith('ipfs://')

        if (isIpfs) {
          try {
            const json = await fetchIpfsJson<ChannelMessagePayload>(raw)
            if (json.type === 'teia-channel-message') parsed = json
          } catch {
            // IPFS fetch failed — show raw URI
          }
        } else {
          try {
            const json = JSON.parse(raw)
            if (json.type === 'teia-channel-message') parsed = json
          } catch {
            // legacy plain-text message
          }
        }

        return {
          ...entry.value,
          id: parseInt(entry.key),
          content: parsed ? parsed.content : raw,
          payload: parsed,
          isIpfs,
        }
      }))
    },
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
