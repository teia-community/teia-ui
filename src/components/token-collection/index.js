import useSWR from 'swr'
import get from 'lodash/get'
import { request } from 'graphql-request'
import { renderMediaType } from '@components/media-types'
import { ResponsiveMasonry } from '@components/responsive-masonry'
import { METADATA_CONTENT_RATING_MATURE, PATH } from '@constants'
import { FeedItem } from '@components/feed-item'
import { Container, Padding } from '@components/layout'
import { Button } from '@components/button'
import InfiniteScroll from 'react-infinite-scroller'
import { useSearchParams } from 'react-router-dom'
import useSettings from '@hooks/use-settings'
import styles from './styles.module.scss'
import laggy from '../../utils/swr-laggy-middleware'

function SingleView({ tokens }) {
  return (
    <Container>
      <Padding>
        {tokens.map((token) => (
          <div key={token.key || token.id}>
            <FeedItem nft={token} />
          </div>
        ))}
      </Padding>
    </Container>
  )
}

function MasonryView({ tokens }) {
  return (
    <ResponsiveMasonry>
      {tokens.map((token) => (
        <div key={token.key || token.id} className={styles.cardContainer}>
          <Button
            style={{ positon: 'relative' }}
            to={`${PATH.OBJKT}/${token.token_id}`}
          >
            <div
              className={`${styles.container} ${
                token.isNsfw ||
                (get(token, 'teia_meta.content_rating') &&
                  get(token, 'teia_meta.content_rating') ===
                    METADATA_CONTENT_RATING_MATURE)
                  ? styles.blur
                  : ''
              }`}
            >
              {renderMediaType({
                nft: token,
                displayView: true,
              })}
            </div>
          </Button>
        </div>
      ))}
    </ResponsiveMasonry>
  )
}

function TokenCollection({
  query,
  namespace,
  defaultViewMode = 'single',
  variables = {},
  swrParams = [],
  itemsPerLoad = 40,
  maxItems = 2000,
  resultsPath = 'tokens',
  tokenPath = '',
  keyPath = 'token_id',
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { walletBlockMap, nsfwMap } = useSettings()
  const viewMode = searchParams.get('view')
    ? searchParams.get('view')
    : defaultViewMode
  const limit = searchParams.get(namespace)
    ? parseInt(searchParams.get(namespace), 10)
    : itemsPerLoad

  const { data, error } = useSWR(
    [namespace, ...swrParams],
    (ns) =>
      request(process.env.REACT_APP_TEIA_TEZTOK_GRAPHQL_API, query, {
        ...variables,
        ...(maxItems ? { limit: maxItems } : {}),
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
  })
    .filter((token) => walletBlockMap.get(token.artist_address) !== 1)
    .map((token) => ({
      ...token,
      isNsfw: nsfwMap.get(token.token_id) === 1,
    }))

  if (!tokens.length) {
    return (
      <Container>
        <Padding>
          <h1>{emptyMessage}</h1>
        </Padding>
      </Container>
    )
  }

  const limitedTokens = tokens.slice(0, limit)

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <button
          onClick={() => {
            setSearchParams({
              ...Object.fromEntries(searchParams),
              view: viewMode === 'single' ? 'masonry' : 'single',
            })
          }}
        >
          {viewMode === 'single'
            ? 'set view-mode to masonry'
            : 'set view-mode to single'}
        </button>
      </div>
      <InfiniteScroll
        loadMore={() => {
          setSearchParams({
            ...Object.fromEntries(searchParams),
            [namespace]: limit + itemsPerLoad,
          })
        }}
        hasMore={limit < tokens.length}
      >
        {viewMode === 'single' ? (
          <SingleView tokens={limitedTokens} />
        ) : (
          <MasonryView tokens={limitedTokens} />
        )}
      </InfiniteScroll>
    </div>
  )
}

export default TokenCollection
