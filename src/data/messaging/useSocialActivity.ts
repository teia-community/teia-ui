// Unified, Channels & DMs activity feed.
//
// Merges public channel messages + poll comments + token comments (all from the
// messaging contracts) into a single, normalized, time-sorted stream.
//
// Pagination: each of the three sources is paged independently via
// useSWRInfinite; a single loadMore() advances all of them by one page and the
// merged result is re-sorted. Chronological order is exact for everything
// fetched so far — at the boundary an as-yet-unfetched older item from one
// source can appear once the next page loads (standard for merged feeds).
//
// Privacy/visibility rules enforced here:
//  - channel posts are included only when the channel is `unrestricted` (public)
//  - hidden (moderated) messages/comments are dropped

import useSWRInfinite from 'swr/infinite'
import {
  fetchRecentCommentsPage,
  fetchRecentChannelMessagesPage,
  RECENT_LIMIT,
  type AdminComment,
  type AdminMessage,
} from './admin'

const PAGE_SIZE = RECENT_LIMIT

export type ActivitySort = 'newest' | 'oldest'

export type SocialActivityKind = 'channel' | 'poll_comment' | 'token_comment'

export interface SocialActivityItem {
  id: string
  kind: SocialActivityKind
  sender: string
  content: string
  timestamp: string
  /** In-app route to the conversation the item belongs to. */
  to: string
  /** Short human label for the link target. */
  targetLabel: string
}

/** One paginated source (one messaging contract / event tag). */
function useInfiniteSource<T>(
  ns: string,
  sort: ActivitySort,
  fetchPage: (opts: {
    limit: number
    offset: number
    sort: 'asc' | 'desc'
  }) => Promise<T[]>
) {
  const dir = sort === 'oldest' ? 'asc' : 'desc'

  const getKey = (pageIndex: number, previous: T[] | null) => {
    if (previous && previous.length === 0) return null
    return [ns, sort, pageIndex]
  }

  const { data, error, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    // SWR v1 spreads array-key parts as separate fetcher args.
    (_ns: string, _sort: ActivitySort, pageIndex: number) =>
      fetchPage({
        limit: PAGE_SIZE,
        offset: pageIndex * PAGE_SIZE,
        sort: dir,
      }),
    { revalidateFirstPage: false, revalidateOnFocus: false }
  )

  const rows: T[] = data ? data.flat() : []
  const reachingEnd = Boolean(
    error || (data && data[data.length - 1]?.length < PAGE_SIZE)
  )
  const loadingMore = Boolean(
    isValidating && data && typeof data[size - 1] === 'undefined'
  )

  return {
    rows,
    error,
    size,
    setSize,
    reachingEnd,
    loadingMore,
    loadingInitial: !data && !error,
  }
}

export function useSocialActivity(sort: ActivitySort = 'newest') {
  const channels = useInfiniteSource<AdminMessage>(
    'social:channels',
    sort,
    fetchRecentChannelMessagesPage
  )
  const polls = useInfiniteSource<AdminComment>('social:poll', sort, (opts) =>
    fetchRecentCommentsPage('poll', opts)
  )
  const tokens = useInfiniteSource<AdminComment>('social:token', sort, (opts) =>
    fetchRecentCommentsPage('token', opts)
  )

  const items: SocialActivityItem[] = []

  for (const m of channels.rows) {
    if (m.hidden) continue
    if (m.channelAccessMode !== 'unrestricted') continue
    items.push({
      id: `channel-${m.id}`,
      kind: 'channel',
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      to: `/inbox/channels/${m.channelId}`,
      targetLabel: `#${m.channelId}`,
    })
  }

  for (const c of polls.rows) {
    if (c.hidden) continue
    items.push({
      id: `poll-${c.id}`,
      kind: 'poll_comment',
      sender: c.sender,
      content: c.content,
      timestamp: c.timestamp,
      to: `/poll/${c.pollId}`,
      targetLabel: `Poll #${c.pollId}`,
    })
  }

  for (const c of tokens.rows) {
    if (c.hidden) continue
    items.push({
      id: `token-${c.id}`,
      kind: 'token_comment',
      sender: c.sender,
      content: c.content,
      timestamp: c.timestamp,
      to: `/objkt/${c.tokenId}/comments`,
      targetLabel: `OBJKT #${c.tokenId}`,
    })
  }

  items.sort((a, b) => {
    const delta =
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    return sort === 'oldest' ? delta : -delta
  })

  const loadMore = () => {
    if (!channels.reachingEnd) channels.setSize(channels.size + 1)
    if (!polls.reachingEnd) polls.setSize(polls.size + 1)
    if (!tokens.reachingEnd) tokens.setSize(tokens.size + 1)
  }

  return {
    items,
    error: channels.error || polls.error || tokens.error,
    isLoadingInitial:
      channels.loadingInitial || polls.loadingInitial || tokens.loadingInitial,
    isLoadingMore:
      channels.loadingMore || polls.loadingMore || tokens.loadingMore,
    // Only truly done when every source is exhausted.
    isReachingEnd:
      channels.reachingEnd && polls.reachingEnd && tokens.reachingEnd,
    loadMore,
  }
}

export default useSocialActivity
