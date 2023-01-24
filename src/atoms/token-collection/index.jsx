import useSWR from 'swr'
import get from 'lodash/get'
import { request } from 'graphql-request'
import { ResponsiveMasonry } from '@components/responsive-masonry'
import { FeedItem } from '@components/feed-item'
import { Container } from '@atoms/layout'
import InfiniteScroll from 'react-infinite-scroller'
import { useSearchParams } from 'react-router-dom'
import useSettings from '@hooks/use-settings'
import laggy from '@utils/swr-laggy-middleware'
import { FeedToolbar } from '@components/header/feed_toolbar/FeedToolbar'
import { IconCache } from '@utils/with-icon'
import React from 'react'
import styles from '@style'
import useLocalSettings from '@hooks/use-local-settings'
import { useKeyboard } from '@hooks/use-keyboard'
import { Loading } from '@atoms/loading/index'
import { ErrorComponent } from '@atoms/error'

/**
 * Single view, vertical feed
 * @param {Object} feedProps - The options for the feed item
 * @param {[import("@types").NFT]} feedProps.tokens - The nfts to render
 * @returns {React.ReactElement} The feed
 */
function SingleView({ tokens }) {
  return (
    <div className={styles.single_view}>
      {tokens.map((token) => (
        <FeedItem key={token.token_id} nft={token} />
      ))}
    </div>
  )
}

/**
 * Massorny view feed
 * @param {Object} feedProps - The options for the feed item
 * @param {[import("@types").NFT]} feedProps.tokens - The nfts to render
 * @returns {React.ReactElement} The feed
 */
function MasonryView({ tokens }) {
  return (
    <ResponsiveMasonry>
      {tokens.map((token) => (
        // <motion.div
        //   exit={{ opacity: 0, x: -1000 }}
        //   key={token.key || token.token_id}
        // >
        <FeedItem key={token.key || token.token_id} nft={token} />
        // </motion.div>
      ))}
    </ResponsiveMasonry>
  )
}

/**
 * Main feed component that can be either in Single or Masonry mode.
 * @param {Object} tkProps - The props
 * @param {[import("graphql-request").gql]} tkProps.query - The graphql query
 * @returns {React.ReactElement} The feed
 */
function TokenCollection({
  query,
  namespace,
  disable = false,
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
  const { walletBlockMap, nsfwMap, photosensitiveMap, objktBlockMap } =
    useSettings()

  const { viewMode, toggleViewMode, toggleZen } = useLocalSettings()
  useKeyboard('v', toggleViewMode)
  useKeyboard('z', toggleZen)

  // let inViewMode = searchParams.get('view')
  //   ? searchParams.get('view')
  //   : viewMode

  const limit = searchParams.get(namespace)
    ? parseInt(searchParams.get(namespace), 10)
    : itemsPerLoad

  const { data, error } = useSWR(
    disable ? null : [namespace, ...swrParams],
    async (ns) => {
      return typeof query === 'string'
        ? request(process.env.REACT_APP_TEIA_GRAPHQL_API, query, {
            ...variables,
            ...(maxItems ? { limit: maxItems } : {}),
          })
        : query
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )

  if (error) {
    return (
      <Container>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </Container>
    )
  }

  if (!data) {
    return <Loading />
  }
  if (walletBlockMap === undefined) {
    return (
      <ErrorComponent
        title="Could not retrieve lists"
        message="Please try again in a few minutes."
      />
    )
  }

  const tokens = extractTokensFromResponse(data, {
    postProcessTokens,
    resultsPath,
    tokenPath,
    keyPath,
  })
    .filter(
      (token) =>
        walletBlockMap.get(token.artist_address) !== 1 &&
        objktBlockMap.get(token.id) !== 1
    )
    .map((token) => {
      return {
        ...token,
        isNSFW: nsfwMap.get(token.token_id) === 1,
        isPhotosensitive: photosensitiveMap.get(token.token_id) === 1,
      }
    })

  if (!tokens.length) {
    return (
      <Container>
        <h1>{emptyMessage}</h1>
      </Container>
    )
  }

  const limitedTokens = tokens.slice(0, limit)

  return (
    <div className={styles.feed_container}>
      <IconCache.Provider value={{}}>
        <FeedToolbar />
        <InfiniteScroll
          className={`${viewMode === 'masonry' && styles.infinite_scroll}`}
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
      </IconCache.Provider>
    </div>
  )
}

export default TokenCollection
