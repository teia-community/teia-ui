/**
 * SWR hooks for fetching token-gated chat data via TzKT events.
 *
 * Each FA2 contract + token ID combination has a dedicated chat room.
 * The contract verifies FA2 token balance on-chain before allowing posts.
 * Messages are paginated (newest first, 50 per page).
 */
import useSWR from 'swr'
import { useCallback, useRef, useState } from 'react'
import { bytesToString } from '@taquito/utils'
import { MESSAGING_TOKEN_GATE_CONTRACT, MESSAGING_TZKT_API } from '@constants'
import { fetchEventsPage, fetchAllEvents, fetchContractStorage } from './api'
import { fetchMsgIpfsJson } from './ipfs'
import type {
  TgMessagePostedEvent,
  TgMessageDeletedEvent,
  TgMessagePayload,
  TgContractStorage,
  TzktToken,
} from './token-gate-types'

const CONTRACT = MESSAGING_TOKEN_GATE_CONTRACT
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

async function parseTgMessage(event: { payload: TgMessagePostedEvent }) {
  const p = event.payload
  const raw = decodeBytes(p.content)
  const isIpfs = raw.startsWith('ipfs://')
  let parsed: TgMessagePayload | null = null

  try {
    if (isIpfs) {
      const json = await fetchMsgIpfsJson<TgMessagePayload>(raw)
      if (json.type === 'teia-tg-message') parsed = json
    } else if (raw) {
      const json = JSON.parse(raw)
      if (json.type === 'teia-tg-message') parsed = json
    }
  } catch (e) {
    console.warn(`Failed to parse token gate message #${p.message_id}:`, e)
  }

  return {
    id: p.message_id,
    fa2Address: p.fa2_address,
    tokenId: p.token_id,
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

export function useTokenGateStorage() {
  return useSWR(
    `msg:tg-storage:${CONTRACT}`,
    () => fetchContractStorage<TgContractStorage>(CONTRACT),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Token metadata
// ---------------------------------------------------------------------------

/**
 * Fetch FA2 token metadata from TzKT.
 * Uses the /v1/tokens endpoint (not events).
 */
export function useFA2Tokens(fa2Address: string | undefined) {
  return useSWR(
    fa2Address ? `msg:fa2-tokens:${fa2Address}` : null,
    async () => {
      if (!fa2Address) return []
      const res = await fetch(
        `${MESSAGING_TZKT_API}/v1/tokens?contract=${fa2Address}&limit=50`
      )
      if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
      return (await res.json()) as TzktToken[]
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
}

// ---------------------------------------------------------------------------
// Messages (paginated, newest first, server-side filtered)
// ---------------------------------------------------------------------------

export function useTokenRoomMessages(
  fa2Address: string | undefined,
  tokenId: string | undefined
) {
  const [allMessages, setAllMessages] = useState<Awaited<ReturnType<typeof parseTgMessage>>[]>([])
  const [hasMore, setHasMore] = useState(false)
  const offsetRef = useRef(0)
  const deletedIdsRef = useRef<Set<string>>(new Set())
  const isLoadingMoreRef = useRef(false)

  const swrResult = useSWR(
    fa2Address && tokenId
      ? `msg:tg-messages:${CONTRACT}:${fa2Address}:${tokenId}`
      : null,
    async () => {
      if (!fa2Address || !tokenId) return []

      const filterParams = {
        'payload.fa2_address': fa2Address,
        'payload.token_id': tokenId,
      }

      offsetRef.current = 0
      deletedIdsRef.current = new Set()

      const deleted = await fetchAllEvents<TgMessageDeletedEvent>(
        CONTRACT, 'message_deleted', filterParams
      )
      deletedIdsRef.current = new Set(deleted.map((e) => e.payload.message_id))

      const posted = await fetchEventsPage<TgMessagePostedEvent>(
        CONTRACT, 'message_posted', filterParams,
        { limit: MESSAGE_PAGE_SIZE, offset: 0, sort: 'desc' }
      )

      setHasMore(posted.length === MESSAGE_PAGE_SIZE)
      offsetRef.current = posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )
      const messages = await Promise.all(visible.map(parseTgMessage))
      const sorted = messages.reverse()
      setAllMessages(sorted)
      return sorted
    },
    { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 15_000 }
  )

  const loadMore = useCallback(async () => {
    if (!fa2Address || !tokenId || !hasMore || isLoadingMoreRef.current) return
    isLoadingMoreRef.current = true

    const filterParams = {
      'payload.fa2_address': fa2Address,
      'payload.token_id': tokenId,
    }

    try {
      const posted = await fetchEventsPage<TgMessagePostedEvent>(
        CONTRACT, 'message_posted', filterParams,
        { limit: MESSAGE_PAGE_SIZE, offset: offsetRef.current, sort: 'desc' }
      )

      setHasMore(posted.length === MESSAGE_PAGE_SIZE)
      offsetRef.current += posted.length

      const visible = posted.filter(
        (e) => !deletedIdsRef.current.has(e.payload.message_id)
      )
      const older = await Promise.all(visible.map(parseTgMessage))
      setAllMessages((prev) => [...older.reverse(), ...prev])
    } finally {
      isLoadingMoreRef.current = false
    }
  }, [fa2Address, tokenId, hasMore])

  return {
    ...swrResult,
    data: allMessages.length > 0 ? allMessages : swrResult.data,
    loadMore,
    hasMore,
  }
}

export type ParsedTgMessage = Awaited<ReturnType<typeof parseTgMessage>>

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

export function useTokenGateFees() {
  const { data: storage } = useTokenGateStorage()
  return {
    messageFee: storage?.message_fee ? parseInt(storage.message_fee) : 0,
  }
}
