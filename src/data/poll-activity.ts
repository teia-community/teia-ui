// Activity for the Teia polls contract.
//
// Unlike the calendar, wiki and curation contracts, this one emits no events,
// so activity is read from what it stores and from the calls made to it: polls
// come from the contract's own `polls` map (which carries the question), votes
// from the `vote` calls. Comments come from the messaging contract, the same
// source the social feed reads.

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { bytesToString } from '@taquito/utils'
import { POLLS_CONTRACT } from '@constants'
import { fetchRecentCommentsPage } from '@data/messaging/admin'
import type { ActivitySort } from '@data/messaging/useSocialActivity'

const TZKT_API = import.meta.env.VITE_TZKT_API
/** Votes are the busy half; polls themselves number in the dozens. */
const VOTE_LIMIT = 500
const COMMENT_LIMIT = 500
/** Rows revealed at a time, matching the other activity feeds. */
const PAGE_SIZE = 50

export type PollAction = 'poll_created' | 'poll_voted' | 'poll_commented'

export interface PollActivityItem {
  id: string
  action: PollAction
  actor: string
  pollId: string
  question: string | null
  timestamp: string
  ophash: string | null
}

export const POLL_ACTIVITY_FILTERS = [
  { key: 'poll_created', label: 'Polls' },
  { key: 'poll_voted', label: 'Votes' },
  { key: 'poll_commented', label: 'Comments' },
]

function decode(hex: unknown): string {
  try {
    return hex ? bytesToString(String(hex)) : ''
  } catch {
    return ''
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT error: ${res.status}`)
  return res.json()
}

/** Every poll ever created, from the contract's `polls` map. */
async function fetchPolls(): Promise<PollActivityItem[]> {
  const maps = await fetchJson<{ path: string; ptr: number }[]>(
    `${TZKT_API}/v1/contracts/${POLLS_CONTRACT}/bigmaps`
  )
  const polls = maps.find((m) => m.path === 'polls')
  if (!polls) return []

  const rows = await fetchJson<
    { key: string; value: Record<string, unknown> }[]
  >(`${TZKT_API}/v1/bigmaps/${polls.ptr}/keys?limit=1000&active=true`)

  return rows.map((row) => ({
    id: `poll-${row.key}`,
    action: 'poll_created' as const,
    actor: String(row.value?.issuer ?? ''),
    pollId: String(row.key),
    question: decode(row.value?.question) || null,
    timestamp: String(row.value?.timestamp ?? ''),
    ophash: null,
  }))
}

/** Votes cast, from the `vote` calls on the contract. */
async function fetchVotes(): Promise<PollActivityItem[]> {
  const rows = await fetchJson<
    {
      hash: string
      timestamp: string
      sender: { address: string }
      parameter: { value?: { poll_id?: string } } | null
    }[]
  >(
    `${TZKT_API}/v1/operations/transactions?target=${POLLS_CONTRACT}` +
      `&entrypoint=vote&status=applied&sort.desc=id&limit=${VOTE_LIMIT}` +
      `&select=hash,timestamp,sender,parameter`
  )

  return rows.map((row, index) => ({
    id: `vote-${row.hash}-${index}`,
    action: 'poll_voted' as const,
    actor: row.sender?.address ?? '',
    pollId: String(row.parameter?.value?.poll_id ?? ''),
    question: null,
    timestamp: row.timestamp,
    ophash: row.hash,
  }))
}

/** Comments left on polls, from the messaging contract. */
async function fetchPollComments(): Promise<PollActivityItem[]> {
  const rows = await fetchRecentCommentsPage('poll', { limit: COMMENT_LIMIT })
  return rows
    .filter((row) => !row.hidden)
    .map((row) => ({
      id: `comment-${row.id}`,
      action: 'poll_commented' as const,
      actor: row.sender,
      pollId: String(row.pollId ?? ''),
      question: null,
      timestamp: row.timestamp,
      ophash: null,
    }))
}

/**
 * Polls created, votes cast and comments left, newest first by default. Both sides are small
 * enough to hold at once, so this sorts in the browser rather than paging two
 * sources against each other.
 */
export function usePollActivity(
  actions: string[] = [],
  sort: ActivitySort = 'newest'
) {
  const { data, error, isValidating } = useSWR(
    ['poll-activity'],
    async () => {
      const [polls, votes, comments] = await Promise.all([
        fetchPolls(),
        fetchVotes(),
        fetchPollComments(),
      ])
      return [...polls, ...votes, ...comments]
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  const questions: Record<string, string> = {}
  for (const item of data ?? []) {
    if (item.action === 'poll_created' && item.question) {
      questions[item.pollId] = item.question
    }
  }

  const all = (data ?? [])
    .filter((item) => actions.length === 0 || actions.includes(item.action))
    .map((item) => ({
      ...item,
      question: item.question ?? questions[item.pollId] ?? null,
    }))
    .sort((a, b) => {
      const delta =
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      return sort === 'oldest' ? delta : -delta
    })

  // The contract holds few enough polls, votes and comments to read in one
  // go, so paging here is about how many rows the page renders rather than
  // how much is fetched.
  const [page, setPage] = useState(1)
  const pageKey = `${[...actions].sort().join(',')}:${sort}`
  useEffect(() => setPage(1), [pageKey])

  const items = all.slice(0, page * PAGE_SIZE)

  return {
    items,
    total: all.length,
    error,
    isLoadingInitial: !data && !error,
    isValidating,
    isReachingEnd: items.length >= all.length,
    loadMore: () => setPage((current) => current + 1),
  }
}

export default usePollActivity
