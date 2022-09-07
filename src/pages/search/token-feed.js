import { useState } from 'react'
import useSWR from 'swr'
import get from 'lodash/get'
import { request } from 'graphql-request'
import { FeedItem } from '@components/feed-item'
import { Container, Padding } from '@components/layout'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useSearchParams } from 'react-router-dom'
import laggy from '../../utils/swr-laggy-middleware'

function TokenFeed({
  query,
  namespace,
  variables = {},
  swrParams = [],
  itemsPerLoad = 24,
  resultsPath = 'token',
  tokenPath = '',
  keyPath = 'id',
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [limit, setLimit] = useState(
    searchParams.get(namespace)
      ? parseInt(searchParams.get(namespace), 10)
      : itemsPerLoad
  )
  const { data, error } = useSWR(
    [namespace, limit, ...swrParams],
    (ns, limit) =>
      request(process.env.REACT_APP_TEIA_GRAPHQL_API, query, {
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

  // TODO: remove tokens from blocked wallets and restricted objkts
  let tokens = extractTokensFromResponse(data, {
    postProcessTokens,
    resultsPath,
    tokenPath,
    keyPath,
  })

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
      dataLength={tokens.length}
      next={() => {
        const newLimit = limit + itemsPerLoad
        setLimit(newLimit)
        setSearchParams({ [namespace]: newLimit })
      }}
      hasMore={true}
      loader={undefined}
      endMessage={undefined}
    >
      {tokensContainer}
    </InfiniteScroll>
  )
}

export default TokenFeed
