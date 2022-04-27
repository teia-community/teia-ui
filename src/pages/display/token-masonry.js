import { useState } from 'react'
import useSWR from 'swr'
import get from 'lodash/get'
import { request } from 'graphql-request'
import { renderMediaType } from '@components/media-types'
import { ResponsiveMasonry } from '@components/responsive-masonry'
import { PATH } from '@constants'
import { Container, Padding } from '@components/layout'
import { Button } from '@components/button'
import InfiniteScroll from 'react-infinite-scroll-component'
import styles from './styles.module.scss'
import laggy from '../../utils/swr-laggy-middleware'

function TokenMasonry({
  query,
  namespace,
  variables = {},
  swrParams = [],
  itemsPerLoad = 40,
  resultsPath = 'token',
  tokenPath = '',
  keyPath = 'id',
  emptyMessage = 'no results',
  postProcessTokens = (tokens) => tokens,
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
  const [limit, setLimit] = useState(itemsPerLoad)
  const { data, error } = useSWR(
    [namespace, ...swrParams],
    (ns) =>
      request(process.env.REACT_APP_TEIA_GRAPHQL_API, query, {
        ...variables,
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
        <Padding>
          <h1>{emptyMessage}</h1>
        </Padding>
      </Container>
    )
  }

  const tokensContainer = (
    <ResponsiveMasonry>
      {tokens.slice(0, limit).map((token) => (
        <div key={token.key} className={styles.cardContainer}>
          <Button
            style={{ positon: 'relative' }}
            to={`${PATH.OBJKT}/${token.id}`}
          >
            <div className={styles.container}>
              {renderMediaType({
                mimeType: token.mime,
                artifactUri: token.artifact_uri,
                displayUri: token.display_uri,
                displayView: true,
              })}
            </div>
          </Button>
        </div>
      ))}
    </ResponsiveMasonry>
  )

  return (
    <InfiniteScroll
      dataLength={tokens.length}
      next={() => {
        setLimit(limit + itemsPerLoad)
      }}
      hasMore={true}
      loader={undefined}
      endMessage={undefined}
    >
      {tokensContainer}
    </InfiniteScroll>
  )
}

export default TokenMasonry
