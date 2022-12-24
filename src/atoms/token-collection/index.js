import useSWR from 'swr'
import get from 'lodash/get'
import { request } from 'graphql-request'
import { ResponsiveMasonry } from '@components/responsive-masonry'
import { FeedItem } from '@components/feed-item'
import { Container } from '@atoms/layout'
import InfiniteScroll from 'react-infinite-scroller'
import { useSearchParams } from 'react-router-dom'
import useSettings from '@hooks/use-settings'
import laggy from '../../utils/swr-laggy-middleware'
import { FilterBar } from '@components/header/filters/FilterBar'
import { useContext } from 'react'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { IconCache } from '@utils/with-icon'
import { AnimatePresence, motion } from 'framer-motion'
// import { renderMediaType } from '@components/media-types'
// import { METADATA_CONTENT_RATING_MATURE, PATH } from '@constants'
// import { Button } from '@atoms/button'
// import styles from '@style'

/**
 * Single view, vertical feed
 * @param {Object} feedProps - The options for the feed item
 * @param {[import("@types").NFT]} feedProps.tokens - The nfts to render
 * @returns {React.ReactElement} The feed
 */
function SingleView({ tokens }) {
  return (
    <>
      {tokens.map((token) => (
        <FeedItem key={token.token_id} nft={token} />
      ))}
    </>
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
        // <div key={token.key || token.id} className={styles.cardContainer}>
        //   <Button
        //     style={{ positon: 'relative' }}
        //     to={`${PATH.OBJKT}/${token.token_id}`}
        //   >
        //     <div
        //       className={`${styles.container} ${
        //         token.isNsfw ||
        //         (get(token, 'teia_meta.content_rating') &&
        //           get(token, 'teia_meta.content_rating') ===
        //             METADATA_CONTENT_RATING_MATURE)
        //           ? styles.blur
        //           : ''
        //       }`}
        //     >
        //       {renderMediaType({
        //         nft: token,
        //         displayView: true,
        //       })}
        //     </div>
        //   </Button>
        // </div>
        // TODO: I did not fully check this, but using the new "zen" prop on FeedItem should mimic this 👆
        <motion.div
          exit={{ opacity: 0, x: -1000 }}
          key={token.key || token.token_id}
        >
          <FeedItem /*zen*/ nft={token} />
        </motion.div>
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
  const { walletBlockMap, nsfwMap } = useSettings()

  const context = useContext(HicetnuncContext)
  const inViewMode = searchParams.get('view') ? searchParams.get('view') : null
  const { viewMode } = context
  const limit = searchParams.get(namespace)
    ? parseInt(searchParams.get(namespace), 10)
    : itemsPerLoad

  const { data, error } = useSWR(
    disable ? null : [namespace, ...swrParams],
    async (ns) => {
      if (typeof query === 'string') {
        return request(process.env.REACT_APP_TEIA_GRAPHQL_API, query, {
          ...variables,
          ...(maxItems ? { limit: maxItems } : {}),
        })
      } else {
        // it's possible to also pass in the response data in the query
        return query
      }
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
    return <Container>loading...</Container>
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
        <h1>{emptyMessage}</h1>
      </Container>
    )
  }

  const limitedTokens = tokens.slice(0, limit)

  return (
    <div>
      <FilterBar />
      <InfiniteScroll
        loadMore={() => {
          setSearchParams({
            ...Object.fromEntries(searchParams),
            [namespace]: limit + itemsPerLoad,
          })
        }}
        hasMore={limit < tokens.length}
      >
        <IconCache.Provider value={{}}>
          <AnimatePresence>
            {(inViewMode ? inViewMode : viewMode) === 'single' ? (
              <SingleView tokens={limitedTokens} />
            ) : (
              <MasonryView tokens={limitedTokens} />
            )}
          </AnimatePresence>
        </IconCache.Provider>
      </InfiniteScroll>
    </div>
  )
}

export default TokenCollection
