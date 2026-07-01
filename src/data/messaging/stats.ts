/**
 * Public messaging stats, ported from the ube-wiki stats page and extended
 * with channels/DMs.
 *
 * Privacy: only PUBLIC channels (access mode `unrestricted`, non-DM) are shown
 * in detail (names, senders, per-channel counts). Private/allowlist channels
 * and DMs contribute only to aggregate counts and total message volume.
 */
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import {
  POLL_COMMENTS_CONTRACT,
  TOKEN_COMMENTS_CONTRACT,
  CHANNELS_V2_CONTRACT,
} from '@constants'
import { fetchAllEvents } from './api'
import { fetchMsgIpfsJson } from './ipfs'
import type { TzktEvent } from './poll-comments-types'

// ---------------------------------------------------------------------------
// TzKT request throttling
//
// This is a testing one shot, claude likes refetching.
// It will be changed in a future commit to a more performant way
// ---------------------------------------------------------------------------

const MAX_CONCURRENT = 3
let active = 0
const waiters: (() => void)[] = []

async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiters.push(resolve))
  }
  active += 1
  try {
    return await fn()
  } finally {
    active -= 1
    waiters.shift()?.()
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Fetch all events for a tag, throttled and with backoff on 429. */
async function fetchEvents<P>(
  contract: string,
  tag: string
): Promise<TzktEvent<P>[]> {
  return withLimit(async () => {
    let delay = 600
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await fetchAllEvents<P>(contract, tag)
      } catch (e) {
        const is429 = String(e).includes('429')
        if (!is429 || attempt === 4) throw e
        await sleep(delay)
        delay *= 2
      }
    }
    return []
  })
}

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export interface TimeBucket {
  week: string
  count: number
}

export interface AddressCount {
  address: string
  count: number
}

interface PostedPayload {
  poll_id?: string
  fa2_address?: string
  token_id?: string
  comment_id: string
  sender: string
  timestamp: string
}

interface HidePayload {
  comment_id: string
  hidden: boolean
}

interface ModeratedPayload {
  comment_id: string
  hidden: boolean
  moderator: string
}

interface BannedPayload {
  address: string
  banned: boolean
}

interface ChannelCreatedPayload {
  channel_id: string
  creator: string
  metadata_uri: string
  access_mode: Record<string, unknown>
  timestamp: string
}

interface MessagePostedPayload {
  channel_id: string
  message_id: string
  sender: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** ISO week-start (Monday, UTC) for a timestamp, e.g. "2026-06-15". */
function weekStartISO(timestamp: string): string {
  const d = new Date(timestamp)
  const day = d.getUTCDay()
  const offset = (day + 6) % 7 // days since Monday
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset)
  )
  return monday.toISOString().slice(0, 10)
}

function bucketWeeks(timestamps: string[]): TimeBucket[] {
  const buckets = new Map<string, number>()
  for (const ts of timestamps) {
    const w = weekStartISO(ts)
    buckets.set(w, (buckets.get(w) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, count]) => ({ week, count }))
}

function topN<T>(
  items: T[],
  keyFn: (t: T) => string,
  n: number
): { key: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = keyFn(item)
    if (!k) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }))
}

/** Replay ban events (by id order) to a final ban-list size. */
function computeBannedSet(
  events: { id: number; payload: BannedPayload }[]
): Set<string> {
  const sorted = [...events].sort((a, b) => a.id - b.id)
  const out = new Set<string>()
  for (const e of sorted) {
    if (e.payload.banned) out.add(e.payload.address)
    else out.delete(e.payload.address)
  }
  return out
}

/** A comment is hidden iff its latest hide-flip (self or moderator) left it so. */
function computeCurrentlyHidden(
  hiddenSet: { id: number; payload: HidePayload }[],
  moderated: { id: number; payload: ModeratedPayload }[]
): number {
  const merged = [
    ...hiddenSet.map((e) => ({
      id: e.id,
      comment_id: e.payload.comment_id,
      hidden: e.payload.hidden,
    })),
    ...moderated.map((e) => ({
      id: e.id,
      comment_id: e.payload.comment_id,
      hidden: e.payload.hidden,
    })),
  ].sort((a, b) => a.id - b.id)

  const state = new Map<string, boolean>()
  for (const e of merged) state.set(e.comment_id, e.hidden)
  return Array.from(state.values()).filter(Boolean).length
}

function accessModeOf(variant: Record<string, unknown> | undefined): string {
  if (!variant) return 'unrestricted'
  return Object.keys(variant)[0] ?? 'unrestricted'
}

function decodeBytes(hex: string | null | undefined): string {
  try {
    return hex ? bytesToString(hex) : ''
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Comment stats (poll + token share most of the shape)
// ---------------------------------------------------------------------------

export interface PollStats {
  totalComments: number
  totalEdits: number
  uniquePolls: number
  uniqueCommenters: number
  currentlyHidden: number
  hideActionsBySender: number
  hideActionsByModerator: number
  bannedCount: number
  topPolls: { pollId: string; count: number }[]
  topCommenters: AddressCount[]
  topModerators: AddressCount[]
  weeklyPosts: TimeBucket[]
}

export interface TokenStats {
  totalComments: number
  totalEdits: number
  uniqueTokens: number
  uniqueFa2Contracts: number
  uniqueCommenters: number
  currentlyHidden: number
  hideActionsBySender: number
  hideActionsByModerator: number
  bannedCount: number
  topTokens: { fa2Address: string; tokenId: string; count: number }[]
  topFa2Contracts: { fa2Address: string; count: number }[]
  topCommenters: AddressCount[]
  topModerators: AddressCount[]
  weeklyPosts: TimeBucket[]
}

async function fetchCommentEvents(contract: string) {
  const [posted, edited, hiddenSet, moderated, banned] = await Promise.all([
    fetchEvents<PostedPayload>(contract, 'comment_posted'),
    fetchEvents<PostedPayload>(contract, 'comment_edited'),
    fetchEvents<HidePayload>(contract, 'comment_hidden_set'),
    fetchEvents<ModeratedPayload>(contract, 'comment_moderated'),
    fetchEvents<BannedPayload>(contract, 'user_banned_set'),
  ])
  return { posted, edited, hiddenSet, moderated, banned }
}

export function usePollStats() {
  return useSWR<PollStats>(
    POLL_COMMENTS_CONTRACT ? `stats:poll:${POLL_COMMENTS_CONTRACT}` : null,
    async () => {
      const { posted, edited, hiddenSet, moderated, banned } =
        await fetchCommentEvents(POLL_COMMENTS_CONTRACT)

      return {
        totalComments: posted.length,
        totalEdits: edited.length,
        uniquePolls: new Set(posted.map((e) => e.payload.poll_id)).size,
        uniqueCommenters: new Set(posted.map((e) => e.payload.sender)).size,
        currentlyHidden: computeCurrentlyHidden(hiddenSet, moderated),
        hideActionsBySender: hiddenSet.length,
        hideActionsByModerator: moderated.length,
        bannedCount: computeBannedSet(banned).size,
        topPolls: topN(posted, (e) => e.payload.poll_id ?? '', 10).map(
          ({ key, count }) => ({ pollId: key, count })
        ),
        topCommenters: topN(posted, (e) => e.payload.sender, 10).map(
          ({ key, count }) => ({ address: key, count })
        ),
        topModerators: topN(moderated, (e) => e.payload.moderator, 5).map(
          ({ key, count }) => ({ address: key, count })
        ),
        weeklyPosts: bucketWeeks(posted.map((e) => e.payload.timestamp)),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

export function useTokenStats() {
  return useSWR<TokenStats>(
    TOKEN_COMMENTS_CONTRACT ? `stats:token:${TOKEN_COMMENTS_CONTRACT}` : null,
    async () => {
      const { posted, edited, hiddenSet, moderated, banned } =
        await fetchCommentEvents(TOKEN_COMMENTS_CONTRACT)

      const tokenKey = (e: { payload: PostedPayload }) =>
        `${e.payload.fa2_address}:${e.payload.token_id}`

      return {
        totalComments: posted.length,
        totalEdits: edited.length,
        uniqueTokens: new Set(posted.map(tokenKey)).size,
        uniqueFa2Contracts: new Set(posted.map((e) => e.payload.fa2_address))
          .size,
        uniqueCommenters: new Set(posted.map((e) => e.payload.sender)).size,
        currentlyHidden: computeCurrentlyHidden(hiddenSet, moderated),
        hideActionsBySender: hiddenSet.length,
        hideActionsByModerator: moderated.length,
        bannedCount: computeBannedSet(banned).size,
        topTokens: topN(posted, tokenKey, 10).map(({ key, count }) => {
          const [fa2Address, tokenId] = key.split(':')
          return { fa2Address, tokenId, count }
        }),
        topFa2Contracts: topN(
          posted,
          (e) => e.payload.fa2_address ?? '',
          5
        ).map(({ key, count }) => ({ fa2Address: key, count })),
        topCommenters: topN(posted, (e) => e.payload.sender, 10).map(
          ({ key, count }) => ({ address: key, count })
        ),
        topModerators: topN(moderated, (e) => e.payload.moderator, 5).map(
          ({ key, count }) => ({ address: key, count })
        ),
        weeklyPosts: bucketWeeks(posted.map((e) => e.payload.timestamp)),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Channel + DM stats (privacy-aware)
// ---------------------------------------------------------------------------

export interface ChannelStats {
  publicChannels: number
  privateChannels: number
  dms: number
  totalMessages: number
  publicMessages: number
  /** Aggregate message volume across private channels + DMs (no breakdown). */
  privateMessages: number
  uniquePublicSenders: number
  publicEdits: number
  /** Weekly volume across ALL channels (anonymized aggregate, for the chart). */
  weeklyMessages: TimeBucket[]
  topPublicChannels: { channelId: string; name: string; count: number }[]
  topPublicSenders: AddressCount[]
}

async function resolveChannelKindName(
  metadataHex: string,
  channelId: string
): Promise<{ kind: string; name: string }> {
  const uri = decodeBytes(metadataHex)
  if (uri.startsWith('ipfs://')) {
    try {
      const json = await fetchMsgIpfsJson<{ kind?: string; name?: string }>(uri)
      return {
        kind: json.kind ?? 'channel',
        name: json.name ?? `Channel #${channelId}`,
      }
    } catch {
      // fall through
    }
  }
  return { kind: 'channel', name: `Channel #${channelId}` }
}

export function useChannelStats() {
  return useSWR<ChannelStats>(
    CHANNELS_V2_CONTRACT ? `stats:channels:${CHANNELS_V2_CONTRACT}` : null,
    async () => {
      const c = CHANNELS_V2_CONTRACT
      const [created, posted, edited] = await Promise.all([
        fetchEvents<ChannelCreatedPayload>(c, 'channel_created'),
        fetchEvents<MessagePostedPayload>(c, 'message_posted'),
        fetchEvents<MessagePostedPayload>(c, 'message_edited'),
      ])

      // Resolve each channel's privacy (access mode is on-chain; kind is in
      // IPFS metadata). A channel is PUBLIC iff unrestricted and not a DM.
      // Resolve metadata in small batches so we don't hit the IPFS gateway
      // with one request per channel all at once (rate-limit → retries → slow).
      // Will be changed later on
      const channelInfo = new Map<
        string,
        { isPublic: boolean; isDm: boolean; name: string }
      >()
      const CHUNK = 6
      for (let i = 0; i < created.length; i += CHUNK) {
        const slice = created.slice(i, i + CHUNK)
        await Promise.all(
          slice.map(async (e) => {
            const { kind, name } = await resolveChannelKindName(
              e.payload.metadata_uri,
              e.payload.channel_id
            )
            const isDm = kind === 'dm'
            const isPublic =
              accessModeOf(e.payload.access_mode) === 'unrestricted' && !isDm
            channelInfo.set(e.payload.channel_id, { isPublic, isDm, name })
          })
        )
      }

      let publicChannels = 0
      let privateChannels = 0
      let dms = 0
      for (const info of channelInfo.values()) {
        if (info.isDm) dms += 1
        else if (info.isPublic) publicChannels += 1
        else privateChannels += 1
      }

      const isPublicChannel = (id: string) =>
        channelInfo.get(id)?.isPublic ?? false

      const publicMsgs = posted.filter((e) =>
        isPublicChannel(e.payload.channel_id)
      )
      const publicEdits = edited.filter((e) =>
        isPublicChannel(e.payload.channel_id)
      ).length

      return {
        publicChannels,
        privateChannels,
        dms,
        totalMessages: posted.length,
        publicMessages: publicMsgs.length,
        privateMessages: posted.length - publicMsgs.length,
        uniquePublicSenders: new Set(publicMsgs.map((e) => e.payload.sender))
          .size,
        publicEdits,
        weeklyMessages: bucketWeeks(posted.map((e) => e.payload.timestamp)),
        topPublicChannels: topN(
          publicMsgs,
          (e) => e.payload.channel_id,
          10
        ).map(({ key, count }) => ({
          channelId: key,
          name: channelInfo.get(key)?.name ?? `Channel #${key}`,
          count,
        })),
        topPublicSenders: topN(publicMsgs, (e) => e.payload.sender, 10).map(
          ({ key, count }) => ({ address: key, count })
        ),
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}
