/**
 * Admin/moderation read hooks for the moderation console
 * `/inbox/admin` this will be unified in another URL with a future commit
 *
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import {
  POLL_COMMENTS_CONTRACT,
  TOKEN_COMMENTS_CONTRACT,
  CHANNELS_V2_CONTRACT,
} from '@constants'
import { fetchEventsPage, fetchBigMapValuesBulk } from './api'
import { fetchMsgIpfsJson } from './ipfs'

const TZKT_API = import.meta.env.VITE_TZKT_API

/** How many recent items each moderation table loads up front. */
export const RECENT_LIMIT = 50

export type CommentKind = 'poll' | 'token'

export function commentContractFor(kind: CommentKind): string {
  return kind === 'poll' ? POLL_COMMENTS_CONTRACT : TOKEN_COMMENTS_CONTRACT
}

function decodeBytes(hex: string | null | undefined): string {
  try {
    return hex ? bytesToString(hex) : ''
  } catch {
    return ''
  }
}

/** Decode a comment/message `content` field (raw JSON or ipfs:// pointer). */
async function decodeContent(
  hex: string | null | undefined,
  expectedType: string
): Promise<string> {
  const raw = decodeBytes(hex)
  try {
    if (raw.startsWith('ipfs://')) {
      const json = await fetchMsgIpfsJson<{ type?: string; content?: string }>(
        raw
      )
      if (json.type === expectedType) return json.content ?? ''
    } else if (raw) {
      const json = JSON.parse(raw)
      if (json.type === expectedType) return json.content ?? ''
    }
  } catch {
    // fall through to raw
  }
  return raw
}

// ---------------------------------------------------------------------------
// Recent comments (poll + token) for the moderation table
// ---------------------------------------------------------------------------

export interface AdminComment {
  id: string
  kind: CommentKind
  sender: string
  content: string
  hidden: boolean
  timestamp: string
  pollId?: string
  fa2Address?: string
  tokenId?: string
}

interface CommentPostedPayload {
  comment_id: string
  sender: string
  timestamp: string
  poll_id?: string
  fa2_address?: string
  token_id?: string
}

interface CommentRow {
  sender: string
  content: string
  hidden: boolean
  timestamp: string
  poll_id?: string
  fa2_address?: string
  token_id?: string
}

export function useRecentComments(kind: CommentKind) {
  const contract = commentContractFor(kind)
  const type = kind === 'poll' ? 'teia-poll-comment' : 'teia-token-comment'

  return useSWR<AdminComment[]>(
    contract ? `admin:recent-comments:${kind}:${contract}` : null,
    async () => {
      const posted = await fetchEventsPage<CommentPostedPayload>(
        contract,
        'comment_posted',
        {},
        { limit: RECENT_LIMIT, sort: 'desc' }
      )

      const ids = posted.map((e) => e.payload.comment_id)
      const rows = await fetchBigMapValuesBulk<CommentRow>(
        contract,
        'comments',
        ids
      )

      return Promise.all(
        posted
          .filter((e) => rows.has(e.payload.comment_id))
          .map(async (e) => {
            const row = rows.get(e.payload.comment_id)!
            const content = await decodeContent(row.content, type)
            return {
              id: e.payload.comment_id,
              kind,
              sender: row.sender ?? e.payload.sender,
              content,
              hidden: Boolean(row.hidden),
              timestamp: row.timestamp ?? e.payload.timestamp,
              pollId: row.poll_id ?? e.payload.poll_id,
              fa2Address: row.fa2_address ?? e.payload.fa2_address,
              tokenId: row.token_id ?? e.payload.token_id,
            } as AdminComment
          })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

// ---------------------------------------------------------------------------
// Recent channel messages for the moderation table
// ---------------------------------------------------------------------------

export interface AdminMessage {
  id: string
  channelId: string
  sender: string
  content: string
  hidden: boolean
  timestamp: string
}

interface MessagePostedPayload {
  message_id: string
  channel_id: string
  sender: string
  timestamp: string
}

interface MessageRow {
  sender: string
  content: string
  hidden: boolean
  timestamp: string
}

export function useRecentChannelMessages() {
  const contract = CHANNELS_V2_CONTRACT
  return useSWR<AdminMessage[]>(
    contract ? `admin:recent-messages:${contract}` : null,
    async () => {
      const posted = await fetchEventsPage<MessagePostedPayload>(
        contract,
        'message_posted',
        {},
        { limit: RECENT_LIMIT, sort: 'desc' }
      )

      const ids = posted.map((e) => e.payload.message_id)
      const rows = await fetchBigMapValuesBulk<MessageRow>(
        contract,
        'messages',
        ids
      )

      return Promise.all(
        posted
          .filter((e) => rows.has(e.payload.message_id))
          .map(async (e) => {
            const row = rows.get(e.payload.message_id)!
            const content = await decodeContent(
              row.content,
              'teia-channel-message'
            )
            return {
              id: e.payload.message_id,
              channelId: e.payload.channel_id,
              sender: row.sender ?? e.payload.sender,
              content,
              hidden: Boolean(row.hidden),
              timestamp: row.timestamp ?? e.payload.timestamp,
            } as AdminMessage
          })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

// ---------------------------------------------------------------------------
// All channels (including hidden) for the channel moderation table
// ---------------------------------------------------------------------------

export interface AdminChannel {
  id: string
  creator: string
  name: string
  hidden: boolean
  messageCount: number
  createdAt: string
}

interface ChannelCreatedPayload {
  channel_id: string
  creator: string
  timestamp: string
}

interface ChannelRow {
  creator: string
  metadata_uri: string
  hidden: boolean
  message_count?: string
  timestamp?: string
}

async function resolveChannelName(
  metadataHex: string | null | undefined,
  channelId: string
): Promise<string> {
  const uri = decodeBytes(metadataHex)
  if (uri.startsWith('ipfs://')) {
    try {
      const json = await fetchMsgIpfsJson<{ name?: string }>(uri)
      if (json.name) return json.name
    } catch {
      // fall through
    }
  }
  return `Channel #${channelId}`
}

export function useAdminChannels() {
  const contract = CHANNELS_V2_CONTRACT
  return useSWR<AdminChannel[]>(
    contract ? `admin:channels:${contract}` : null,
    async () => {
      // Newest channels first, capped at RECENT_LIMIT.
      const created = await fetchEventsPage<ChannelCreatedPayload>(
        contract,
        'channel_created',
        {},
        { limit: RECENT_LIMIT, sort: 'desc' }
      )

      const ids = created.map((e) => e.payload.channel_id)
      const rows = await fetchBigMapValuesBulk<ChannelRow>(
        contract,
        'channels',
        ids
      )

      return Promise.all(
        created
          .filter((e) => rows.has(e.payload.channel_id))
          .map(async (e) => {
            const row = rows.get(e.payload.channel_id)!
            const name = await resolveChannelName(
              row.metadata_uri,
              e.payload.channel_id
            )
            return {
              id: e.payload.channel_id,
              creator: row.creator ?? e.payload.creator,
              name,
              hidden: Boolean(row.hidden),
              messageCount: Number(row.message_count ?? 0),
              createdAt: row.timestamp ?? e.payload.timestamp,
            } as AdminChannel
          })
      )
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

// ---------------------------------------------------------------------------
// Contract-wide ban list + pause state (shared shape across all 3 contracts)
// ---------------------------------------------------------------------------

/** All addresses currently on a contract's `banned` bigmap. */
export function useBannedList(contract: string | undefined) {
  return useSWR<string[]>(
    contract ? `admin:banned-list:${contract}` : null,
    async () => {
      const url = new URL(
        `${TZKT_API}/v1/contracts/${contract}/bigmaps/banned/keys`
      )
      url.searchParams.set('active', 'true')
      url.searchParams.set('select', 'key')
      url.searchParams.set('limit', '10000')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
      const keys: string[] = await res.json()
      return Array.isArray(keys) ? keys.filter(Boolean) : []
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

/** Whether a contract is currently paused (storage `paused` flag). */
export function usePauseState(contract: string | undefined) {
  return useSWR<boolean>(
    contract ? `admin:paused:${contract}` : null,
    async () => {
      const res = await fetch(
        `${TZKT_API}/v1/contracts/${contract}/storage?path=paused`
      )
      if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
      return Boolean(await res.json())
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}
