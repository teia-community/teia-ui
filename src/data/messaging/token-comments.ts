/**
 * SWR hooks for token_comments data via TzKT events and bigmap reads.
 *
 * Mirrors poll-comments. The topic for token comments is the pair
 * (fa2_address, token_id). Each comment carries both, so events are
 * filtered with both keys and the SWR cache key includes both.
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { TOKEN_COMMENTS_CONTRACT } from '@constants'
import {
  fetchAllEvents,
  fetchBigMapValue,
  fetchBigMapValuesBulk,
} from './api'
import { fetchMsgIpfsJson } from './ipfs'
import { fetchGraphQL } from '@data/api'
import type {
  TokenComment,
  TokenCommentPayload,
  TokenCommentPostedEvent,
  TokenCommentVersion,
  TzktEvent,
} from './token-comments-types'

const CONTRACT = TOKEN_COMMENTS_CONTRACT

function decodeBytes(hex: string | null | undefined): string {
  try {
    return hex ? bytesToString(hex) : ''
  } catch {
    return ''
  }
}

interface TokenCommentBigmapRow {
  fa2_address: string
  token_id: string
  sender: string
  content: string
  parent_id: string | null
  hidden: boolean
  timestamp: string
  version: string
}

async function parseComment(
  event: TzktEvent<TokenCommentPostedEvent>,
  row: TokenCommentBigmapRow
): Promise<TokenComment> {
  const p = event.payload
  const raw = decodeBytes(row.content)
  const isIpfs = raw.startsWith('ipfs://')
  let parsed: TokenCommentPayload | null = null

  try {
    if (isIpfs) {
      const json = await fetchMsgIpfsJson<TokenCommentPayload>(raw)
      if (json.type === 'teia-token-comment') parsed = json
    } else if (raw) {
      const json = JSON.parse(raw)
      if (json.type === 'teia-token-comment') parsed = json
    }
  } catch (e) {
    console.warn(`Failed to parse token comment #${p.comment_id}:`, e)
  }

  return {
    id: p.comment_id,
    fa2Address: row.fa2_address,
    tokenId: row.token_id,
    sender: row.sender,
    parentId: row.parent_id,
    timestamp: row.timestamp ?? p.timestamp,
    hidden: Boolean(row.hidden),
    content: parsed?.content ?? raw,
    isIpfs,
    version: parseInt(row.version ?? '1') || 1,
  }
}

/**
 * Load all comments for a (fa2_address, token_id). Ascending (oldest first).
 */
export function useTokenComments(
  fa2Address: string | undefined,
  tokenId: string | undefined
) {
  const enabled = Boolean(fa2Address) && Boolean(tokenId) && Boolean(CONTRACT)
  return useSWR(
    enabled
      ? `msg:token-comments:${CONTRACT}:${fa2Address}:${tokenId}`
      : null,
    async () => {
      if (!fa2Address || !tokenId) return [] as TokenComment[]

      const posted = await fetchAllEvents<TokenCommentPostedEvent>(
        CONTRACT,
        'comment_posted',
        {
          'payload.fa2_address': fa2Address,
          'payload.token_id': tokenId,
        }
      )

      const ids = posted.map((e) => e.payload.comment_id)
      const rows = await fetchBigMapValuesBulk<TokenCommentBigmapRow>(
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

interface TokenCommentHistoryRow {
  fa2_address: string
  token_id: string
  sender: string
  content: string
  parent_id: string | null
  timestamp: string
}

/**
 * Load archived prior versions of a token comment from the
 * `comment_history` bigmap. Only loads when version > 1.
 *
 * The bigmap key is `pair[nat, nat]` (comment_id, version), encoded by
 * TzKT as `{nat_0, nat_1}`.
 */
export function useCommentHistory(
  commentId: string | undefined,
  version: number
) {
  const enabled =
    Boolean(commentId) && version > 1 && Boolean(CONTRACT)
  return useSWR<TokenCommentVersion[]>(
    enabled
      ? `msg:token-comments-history:${CONTRACT}:${commentId}:${version}`
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
        value: TokenCommentHistoryRow
      }[] = await res.json()

      const versions: TokenCommentVersion[] = await Promise.all(
        rows.map(async (row) => {
          const v = row.key.nat_1
          const raw = decodeBytes(row.value.content)
          const isIpfs = raw.startsWith('ipfs://')
          let content = raw
          try {
            if (isIpfs) {
              const json = await fetchMsgIpfsJson<TokenCommentPayload>(raw)
              if (json.type === 'teia-token-comment') content = json.content
            } else if (raw) {
              const json = JSON.parse(raw)
              if (json.type === 'teia-token-comment') content = json.content
            }
          } catch (e) {
            console.warn(
              `Failed to parse history v${v} of token comment #${commentId}:`,
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
 * Check whether an address is on the token_comments contract's ban list.
 * The ban list is contract-wide (not per-token), so this matches the
 * poll-comments shape.
 */
export function useIsBanned(address: string | undefined) {
  return useSWR<boolean>(
    address && CONTRACT
      ? `msg:token-comments-banned:${CONTRACT}:${address}`
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
 * Same shape as poll-comments useUserProfiles, will move to a shared
 * location when we extract the messaging UI.
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
