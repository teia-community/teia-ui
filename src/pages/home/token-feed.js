import { useState } from 'react'
import useSWR from 'swr'
import get from 'lodash/get'
import { request } from 'graphql-request'
import { FeedItem } from '@components/feed-item'
import { Container, Padding } from '@components/layout'
import InfiniteScroll from 'react-infinite-scroller'
import { useSearchParams } from 'react-router-dom'
import laggy from '../../utils/swr-laggy-middleware'
import useSettings from '@hooks/use-settings'

function TokenFeed({
  query,
  namespace,
  variables = {},
  swrParams = [],
  itemsPerLoad = 24,
  resultsPath = 'tokens',
  tokenPath = '',
  keyPath = 'token_id',
  emptyMessage = 'no results',
  postProcessTokens = (tokens) => tokens,
  enableInfinityScroll = true,
  extractTokensFromResponse = (
    data,
    { postProcessTokens, resultsPath, tokenPath, keyPath }
  ) => {
    return postProcessTokens(
      get(data, resultsPath).map((result) => ({
        ...(tokenPath ? get(result, tokenPath) : result),
        key: get(result, keyPath),
      }))
    )
  },
}) {
  const { walletBlockMap, feedIgnoreUriMap } = useSettings()
  const [searchParams, setSearchParams] = useSearchParams()
  const [limit, setLimit] = useState(
    searchParams.get(namespace)
      ? parseInt(searchParams.get(namespace), 10)
      : itemsPerLoad
  )
  const { data, error } = useSWR(
    [namespace, limit, ...swrParams],
    (ns, limit) =>
      request(process.env.REACT_APP_TEIA_TEZTOK_GRAPHQL_API, query, {
        ...variables,
        ...(enableInfinityScroll ? { limit } : {}),
      }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )

  if (error) {
    return (
      <Container>
        <Padding>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </Padding>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container>
        <Padding>loading...</Padding>
      </Container>
    )
  }

  let tokens = extractTokensFromResponse(data, {
    postProcessTokens,
    resultsPath,
    tokenPath,
    keyPath,
  }).filter(
    (token) =>
      walletBlockMap.get(token.artist_address) !== 1 &&
      feedIgnoreUriMap.get(token.artist_address) !== 1
  )

  if (!tokens.length) {
    return (
      <Container>
        <Padding>{emptyMessage}</Padding>
      </Container>
    )
  }

  const tokensContainer = (
    <Container>
      <Padding>
        {tokens.map((token) => (
          <div key={token.key}>
            <FeedItem nft={token} />
          </div>
        ))}
      </Padding>
    </Container>
  )

  if (!enableInfinityScroll) {
    return tokensContainer
  }

  return (
    <InfiniteScroll
      loadMore={() => {
        const newLimit = limit + itemsPerLoad
        setLimit(newLimit)
        setSearchParams({
          ...Object.fromEntries(searchParams),
          [namespace]: newLimit,
        })
      }}
      hasMore={limit < tokens.length}
    >
      {tokensContainer}
    </InfiniteScroll>
  )
}

export default TokenFeed
