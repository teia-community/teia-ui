/**
 * SWR hooks for poll_comments data via TzKT events and bigmap reads.
 *
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { POLL_COMMENTS_CONTRACT, POLLS_CONTRACT } from '@constants'
import {
  fetchAllEvents,
  fetchBigMapValue,
  fetchBigMapValuesBulk,
} from './api'
import { fetchMsgIpfsJson } from './ipfs'
import { fetchGraphQL } from '@data/api'
import type {
  CommentPostedEvent,
  CommentPayload,
  CommentVersion,
  PollComment,
  TzktEvent,
} from './poll-comments-types'

const CONTRACT = POLL_COMMENTS_CONTRACT

function decodeBytes(hex: string | null | undefined): string {
  try {
    return hex ? bytesToString(hex) : ''
  } catch {
    return ''
  }
}

interface CommentBigmapRow {
  poll_id: string
  sender: string
  content: string
  parent_id: string | null
  hidden: boolean
  timestamp: string
  version: string
}

async function parseComment(
  event: TzktEvent<CommentPostedEvent>,
  row: CommentBigmapRow
): Promise<PollComment> {
  const p = event.payload
  const raw = decodeBytes(row.content)
  const isIpfs = raw.startsWith('ipfs://')
  let parsed: CommentPayload | null = null

  try {
    if (isIpfs) {
      const json = await fetchMsgIpfsJson<CommentPayload>(raw)
      if (json.type === 'teia-poll-comment') parsed = json
    } else if (raw) {
      const json = JSON.parse(raw)
      if (json.type === 'teia-poll-comment') parsed = json
    }
  } catch (e) {
    console.warn(`Failed to parse comment #${p.comment_id}:`, e)
  }

  return {
    id: p.comment_id,
    pollId: p.poll_id,
    sender: row.sender,
    parentId: row.parent_id,
    timestamp: row.timestamp ?? p.timestamp,
    // Authoritative: sender, moderator, and any future hide path all
    // converge in the `comments` bigmap, so reading it here catches every source.
    hidden: Boolean(row.hidden),
    content: parsed?.content ?? raw,
    isIpfs,
    version: parseInt(row.version ?? '1') || 1,
  }
}

/**
 * Load all comments for a poll. Returns ascending (oldest first).
 *
 * Reads `hidden` directly from the comments bigmap rather than replaying
 * the various hide events (`comment_hidden_set`, `comment_moderated`).
 * All hide paths — sender, single-sig moderator, future governance — end
 * up writing to the same bigmap field, so one read covers everything.
 */
export function usePollComments(pollId: string | undefined) {
  return useSWR(
    pollId && CONTRACT
      ? `msg:poll-comments:${CONTRACT}:${pollId}`
      : null,
    async () => {
      if (!pollId) return [] as PollComment[]

      const posted = await fetchAllEvents<CommentPostedEvent>(
        CONTRACT,
        'comment_posted',
        { 'payload.poll_id': pollId }
      )

      const ids = posted.map((e) => e.payload.comment_id)
      const rows = await fetchBigMapValuesBulk<CommentBigmapRow>(
        CONTRACT,
        'comments',
        ids
      )

      const comments = await Promise.all(
        posted
          .filter((e) => rows.has(e.payload.comment_id))
          .map((e) => parseComment(e, rows.get(e.payload.comment_id)!))
      )
      return comments
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  )
}

interface CommentHistoryRow {
  poll_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

/**
 * Load archived prior versions of a comment from the `comment_history`
 * bigmap.
 *
 * Load only from version > 1
 */
export function useCommentHistory(
  commentId: string | undefined,
  version: number
) {
  const whatWeAreLookingFor = Boolean(commentId) && version > 1 && Boolean(CONTRACT)
  return useSWR<CommentVersion[]>(
    whatWeAreLookingFor
      ? `msg:poll-comments-history:${CONTRACT}:${commentId}:${version}`
      : null,
    async () => {
      const url = new URL(
        `${import.meta.env.VITE_TZKT_API}/v1/contracts/${CONTRACT}/bigmaps/comment_history/keys`
      )
      url.searchParams.set('active', 'true')
      url.searchParams.set('key.nat_0', String(commentId))
      url.searchParams.set('select', 'key,value')
      url.searchParams.set('limit', String(Math.max(version - 1, 1)))

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
      const rows: {
        key: { nat_0: string; nat_1: string }
        value: CommentHistoryRow
      }[] = await res.json()

      const versions: CommentVersion[] = await Promise.all(
        rows.map(async (row) => {
          const v = row.key.nat_1
          const raw = decodeBytes(row.value.content)
          const isIpfs = raw.startsWith('ipfs://')
          let content = raw
          try {
            if (isIpfs) {
              const json = await fetchMsgIpfsJson<CommentPayload>(raw)
              if (json.type === 'teia-poll-comment') content = json.content
            } else if (raw) {
              const json = JSON.parse(raw)
              if (json.type === 'teia-poll-comment') content = json.content
            }
          } catch (e) {
            console.warn(
              `Failed to parse history v${v} of comment #${commentId}:`,
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

/**
 * Quick fetch for all comments posted.
 *
 * This function is subject to change.
 */
export function useAllPollCommentCounts() {
  return useSWR<Record<string, number>>(
    CONTRACT ? `msg:poll-comments-counts:${CONTRACT}` : null,
    async () => {
      const posted = await fetchAllEvents<CommentPostedEvent>(
        CONTRACT,
        'comment_posted'
      )
      const counts: Record<string, number> = {}
      for (const e of posted) {
        const id = e.payload.poll_id
        counts[id] = (counts[id] ?? 0) + 1
      }
      return counts
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

/**
 * Returns a map of pollId -> maxCommentId for comments on polls the viewer
 * created (or replies to their own comments), excluding the viewer's own
 * comments. Compared against read state to compute unread poll comments in
 * the notifications center.
 */
export function useMyPollNotifications(viewerAddress: string | undefined) {
  return useSWR<Record<string, number>>(
    viewerAddress && CONTRACT
      ? `msg:poll-notify-map:${CONTRACT}:${viewerAddress}`
      : null,
    async () => {
      if (!viewerAddress) return {}

      // NOTE: scans the full comment_posted history on every load. Fine at
      // current volume; revisit with a cursor / server-side filter as the
      // comment history grows.
      const posted = await fetchAllEvents<CommentPostedEvent>(
        CONTRACT,
        'comment_posted'
      )

      const myCommentIds = new Set<string>()
      for (const e of posted) {
        if (e.payload.sender === viewerAddress) {
          myCommentIds.add(e.payload.comment_id)
        }
      }

      const TZKT_API = import.meta.env.VITE_TZKT_API
      const storageRes = await fetch(
        `${TZKT_API}/v1/contracts/${POLLS_CONTRACT}/storage`
      )
      if (!storageRes.ok) return {}
      const storage = await storageRes.json()
      const bigmapId = storage?.polls
      if (!bigmapId) return {}

      const pollsRes = await fetch(
        `${TZKT_API}/v1/bigmaps/${bigmapId}/keys?value.issuer=${viewerAddress}&active=true&select=key&limit=10000`
      )
      if (!pollsRes.ok) return {}
      const pollKeys: { key: string }[] | string[] = await pollsRes.json()
      const myPollIds = new Set(
        pollKeys.map((k) => (typeof k === 'object' ? k.key : String(k)))
      )

      const maxByPoll: Record<string, number> = {}
      for (const e of posted) {
        if (e.payload.sender === viewerAddress) continue
        const cid = parseInt(e.payload.comment_id, 10)
        const pollId = e.payload.poll_id
        const isOnMyPoll = myPollIds.has(pollId)
        const isReplyToMe =
          e.payload.parent_id && myCommentIds.has(e.payload.parent_id)
        if ((isOnMyPoll || isReplyToMe) && cid > (maxByPoll[pollId] ?? 0)) {
          maxByPoll[pollId] = cid
        }
      }
      return maxByPoll
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
}

/**
 * Check whether an address is on the contract's ban list. Banned addresses
 * are blocked from `post_comment` and `edit_comment` on-chain. We surface
 * this in the UI so banned users see a clear notice instead of a failed tx.
 *
 * The `banned` bigmap stores keys with unit values, so a non-null lookup
 * means the address is banned.
 */
export function useIsBanned(address: string | undefined) {
  return useSWR<boolean>(
    address && CONTRACT
      ? `msg:poll-comments-banned:${CONTRACT}:${address}`
      : null,
    async () => {
      if (!address) return false
      const row = await fetchBigMapValue<unknown>(CONTRACT, 'banned', address)
      return row !== null
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

/**
 * Batched lookup of (alias, identicon) for a set of addresses. 
 * 
 * This function will be updated with the upcoming channels branch.
 * 
 */
interface UserProfile {
  alias?: string
  logo?: string
}

interface TeiaUserRow {
  user_address: string
  name?: string | null
  metadata?: { data?: { identicon?: string | null } | null } | null
}

export function useUserProfiles(addresses: string[]) {
  const unique = [...new Set((addresses ?? []).filter(Boolean))].sort()
  return useSWR<Record<string, UserProfile>>(
    unique.length > 0 ? `teia-user-profiles:${unique.join(',')}` : null,
    async () => {
      const result = await fetchGraphQL(
        `query CommentAuthors($addresses: [String!]!) {
           teia_users(where: { user_address: { _in: $addresses } }) {
             user_address
             name
             metadata { data }
           }
         }`,
        'CommentAuthors',
        { addresses: unique }
      )
      const out: Record<string, UserProfile> = {}
      for (const row of (result?.data?.teia_users ?? []) as TeiaUserRow[]) {
        out[row.user_address] = {
          alias: row.name ?? undefined,
          logo: row.metadata?.data?.identicon ?? undefined,
        }
      }
      return out
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

