// Comments posted on text posts

import useSWRInfinite from 'swr/infinite'
import { request, gql } from 'graphql-request'
import { HEN_CONTRACT_FA2 } from '@constants'
import { fetchRecentCommentsPage, RECENT_LIMIT } from './admin'
import type { ActivitySort, SocialActivityItem } from './useSocialActivity'

const PAGE_SIZE = RECENT_LIMIT

const TEXT_TOKEN_IDS_QUERY = gql`
  query TextTokenIds($ids: [String!]!) {
    tokens(
      where: {
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
        token_id: { _in: $ids }
        _or: [
          { mime_type: { _eq: "text/plain" } }
          { mime_type: { _eq: "text/markdown" } }
        ]
      }
    ) {
      token_id
    }
  }
`

interface TextCommentsPage {
  rawCount: number
  items: SocialActivityItem[]
}

async function fetchTextCommentsPage(
  offset: number,
  sort: 'asc' | 'desc'
): Promise<TextCommentsPage> {
  const page = await fetchRecentCommentsPage('token', {
    limit: PAGE_SIZE,
    offset,
    sort,
  })

  const candidates = page.filter(
    (c) =>
      !c.hidden &&
      c.tokenId &&
      (!c.fa2Address || c.fa2Address === HEN_CONTRACT_FA2)
  )

  let textIds = new Set<string>()
  const ids = [...new Set(candidates.map((c) => c.tokenId as string))]
  if (ids.length) {
    const res: any = await request(
      import.meta.env.VITE_TEIA_GRAPHQL_API,
      TEXT_TOKEN_IDS_QUERY,
      { ids }
    )
    textIds = new Set((res.tokens ?? []).map((t: any) => t.token_id))
  }

  return {
    rawCount: page.length,
    items: candidates
      .filter((c) => textIds.has(c.tokenId as string))
      .map((c) => ({
        id: `token-${c.id}`,
        kind: 'token_comment' as const,
        sender: c.sender,
        content: c.content,
        timestamp: c.timestamp,
        to: `/objkt/${c.tokenId}/comments`,
        targetLabel: `OBJKT #${c.tokenId}`,
      })),
  }
}

export function useTextCommentActivity(sort: ActivitySort = 'newest') {
  const dir = sort === 'oldest' ? 'asc' : 'desc'

  const getKey = (pageIndex: number, previous: TextCommentsPage | null) => {
    if (previous && previous.rawCount === 0) return null
    return ['text-comments', sort, pageIndex]
  }

  const { data, error, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    // SWR v1 spreads array-key parts as separate fetcher args.
    (_ns: string, _sort: ActivitySort, pageIndex: number) =>
      fetchTextCommentsPage(pageIndex * PAGE_SIZE, dir),
    { revalidateFirstPage: false, revalidateOnFocus: false }
  )

  const items = data ? data.flatMap((p) => p.items) : []
  const isReachingEnd = Boolean(
    error || (data && data[data.length - 1]?.rawCount < PAGE_SIZE)
  )
  const isLoadingMore = Boolean(
    isValidating && data && typeof data[size - 1] === 'undefined'
  )

  return {
    items,
    error,
    isLoadingInitial: !data && !error,
    isLoadingMore,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
  }
}

export default useTextCommentActivity
