import { useEffect, useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import get from 'lodash/get'
import set from 'lodash/set'
import uniqBy from 'lodash/uniqBy'
import { request } from 'graphql-request'
import { VirtualColumn, VirtualMasonry } from '@components/responsive-masonry'
import { FeedItem } from '@components/feed-item'
import { Container } from '@atoms/layout'
import InfiniteScroll from 'react-infinite-scroller'
import { useSearchParams } from 'react-router-dom'
import useSettings from '@hooks/use-settings'
import laggy from '@utils/swr-laggy-middleware'
import { FeedToolbar } from '@components/header/feed_toolbar/FeedToolbar'
import styles from '@style'
import { useLocalSettings } from '@context/localSettingsStore'
import { useKeyboard } from '@hooks/use-keyboard'
import { Loading } from '@atoms/loading'
import {
  METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS,
  METADATA_CONTENT_RATING_MATURE,
} from '@constants'
import { IconCache } from '@utils/with-icon'
import { shallow } from 'zustand/shallow'
import { useUserStore } from '@context/userStore'
import { EMPTY_FILTERS, toBoolExp } from '@pages/artists'

// Starting heights for tiles not yet measured (see useVirtualList).
const SINGLE_ESTIMATE = 650
const MASONRY_ESTIMATE = 280

const getTokenKey = (token) => token.key || token.token_id
const renderToken = (token) => <FeedItem nft={token} />

/**
 * Single view, vertical feed
 * @param {Object} feedProps - The options for the feed item
 * @param {[import("@types").NFT]} feedProps.tokens - The nfts to render
 * @returns {React.ReactElement} The feed
 */
function SingleView({ tokens }) {
  return (
    <div className={`${styles.single_view} no-fool`}>
      <VirtualColumn
        items={tokens}
        getKey={getTokenKey}
        renderItem={renderToken}
        estimateSize={SINGLE_ESTIMATE}
        rowClassName={styles.single_row}
      />
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
    <VirtualMasonry
      items={tokens}
      getKey={getTokenKey}
      renderItem={renderToken}
      estimateSize={MASONRY_ESTIMATE}
    />
  )
}
/**
 * @typedef {import("@types").NFT} NFT
 */

// TODO (mel): Avoid pop drilling feeds_menu, once the context will be cleaner we could maybe introduce smaller contexts, one could be the "profile" context
/**
 * Main feed component that can be either in Single or Masonry mode.
 * @param {Object} tkProps - The props
 * @param {[import("graphql-request").gql]} tkProps.query - The graphql query
 * @param {number} tkProps.itemsPerLoad - Batch size
 * @param {number} tkProps.maxItems - Max items to fetch from the indexer
 * @param {boolean} tkProps.paginate - Fetch further maxItems-sized pages (query must take $offset) when scrolled past the end
 * @param {(page:number) => Object} tkProps.pageVariables - With paginate: variables for page n instead of $offset; pages never run out
 * @param {(data:NFT, extra:import("@types").TokenResponse) => [NFT]} tkProps.extractTokensFromResponse - Function to filter the response
 * @param {([NFT]) => [NFT]} tkProps.postProcessTokens - Final filter pass over tokens?
 * @returns {React.ReactElement} The feed
 */
function TokenCollection({
  query,
  label,
  namespace,
  showRestricted = false,
  overrideProtections = false,
  feeds_menu = false,
  disable = false,
  variables = {},
  swrParams = [],
  itemsPerLoad = 40,
  maxItems = 2000,
  paginate = false,
  pageVariables,
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
  const [user_address] = useUserStore((state) => [state.address])
  const [searchParams, setSearchParams] = useSearchParams()
  const { walletBlockMap, nsfwMap, photosensitiveMap, objktBlockMap } =
    useSettings()

  // const { viewMode, toggleViewMode, toggleZen } = useLocalSettings()

  const [viewMode, toggleViewMode, toggleZen] = useLocalSettings(
    (state) => [state.viewMode, state.toggleViewMode, state.toggleZen],
    shallow
  )
  useKeyboard('v', toggleViewMode)
  useKeyboard('z', toggleZen)

  // Hazard toggles shown under the feed search (mirrors the artist directory):
  // flagged tokens are hidden unless their toggle is on.
  const [showPhotosensitive, setShowPhotosensitive] = useState(false)
  const [showNsfw, setShowNsfw] = useState(false)
  const hazards = {
    showPhotosensitive,
    setShowPhotosensitive,
    showNsfw,
    setShowNsfw,
  }

  // Artist directory filters, applied server-side: feeds_menu queries take a
  // `$filters: tokens_bool_exp!`. Debounced so typing a tag doesn't refetch per key.
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [boolExp, setBoolExp] = useState({})
  useEffect(() => {
    const t = setTimeout(() => setBoolExp(toBoolExp(filters)), 300)
    return () => clearTimeout(t)
  }, [filters])
  const filterProps = { filters, setFilters }

  // let inViewMode = searchParams.get('view')
  //   ? searchParams.get('view')
  //   : viewMode

  const limit = searchParams.get(namespace)
    ? parseInt(searchParams.get(namespace), 10)
    : itemsPerLoad

  const filterVariables = feeds_menu ? { filters: boolExp } : {}
  const filterKey = feeds_menu ? [JSON.stringify(boolExp)] : []

  const fetchPage = (page) =>
    request(import.meta.env.VITE_TEIA_GRAPHQL_API, query, {
      ...variables,
      ...filterVariables,
      limit: maxItems,
      ...(pageVariables ? pageVariables(page) : { offset: page * maxItems }),
    })

  const {
    data: firstPage,
    error,
    isLagging,
  } = useSWR(
    disable ? null : [namespace, ...swrParams, ...filterKey],
    async (ns) => {
      return typeof query === 'string'
        ? request(import.meta.env.VITE_TEIA_GRAPHQL_API, query, {
            ...variables,
            ...filterVariables,
            ...(pageVariables ? pageVariables(0) : {}),
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

  // Pages after the first, fetched on demand once the scroll passes the end.
  const {
    data: nextPages = [],
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(
    (index, previous) => {
      const prev = previous || firstPage
      if (!paginate || disable || isLagging || !prev) return null
      if (!pageVariables && get(prev, resultsPath).length < maxItems)
        return null
      return [namespace, ...swrParams, ...filterKey, 'page', index + 1]
    },
    (...key) => fetchPage(key[key.length - 1]),
    { initialSize: 0, revalidateFirstPage: false, revalidateOnFocus: false }
  )

  const lastPage = nextPages.length
    ? nextPages[nextPages.length - 1]
    : firstPage
  const hasMorePages =
    paginate &&
    !!lastPage &&
    (!!pageVariables || get(lastPage, resultsPath).length === maxItems)

  const data =
    firstPage && nextPages.length
      ? set(
          {},
          resultsPath,
          // offsets can shift if new tokens are minted between page loads
          uniqBy(
            [firstPage, ...nextPages].flatMap((page) => get(page, resultsPath)),
            keyPath
          )
        )
      : firstPage

  if (error) {
    return (
      <Container>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </Container>
    )
  }

  if (!data) {
    return (
      <div className={styles.feed_container}>
        <FeedToolbar
          feeds_menu={feeds_menu}
          hazards={hazards}
          filters={filterProps}
        />
        <div className={styles.load_container}>
          <Loading message={`Loading ${label || namespace}`} />
        </div>
      </div>
    )
  }
  if (walletBlockMap === undefined) {
    throw new Error('Please try again in a few minutes.', {
      cause: 'Could not retrieve the ban list',
    })
  }

  const tokens = extractTokensFromResponse(data, {
    postProcessTokens,
    resultsPath,
    tokenPath,
    keyPath,
  })
    .filter((token) =>
      showRestricted
        ? true
        : walletBlockMap.get(token.artist_address) !== 1 &&
          objktBlockMap.get(token.id) !== 1
    )
    .map((token) => {
      return {
        ...token,
        isNSFW:
          !overrideProtections &&
          (nsfwMap.get(token.token_id) === 1 ||
            token.teia_meta?.content_rating === METADATA_CONTENT_RATING_MATURE),

        isPhotosensitive:
          !overrideProtections &&
          (photosensitiveMap.get(token.token_id) === 1 ||
            token.teia_meta?.accessibility?.hazards.includes(
              METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS
            )),

        isModerated:
          (photosensitiveMap.get(token.token_id) === 1 ||
            nsfwMap.get(token.token_id) === 1) &&
          token.artist_address === user_address, // true (testing it in dev is not trivial)
      }
    })
    .filter(
      (token) =>
        !feeds_menu ||
        ((showPhotosensitive || !token.isPhotosensitive) &&
          (showNsfw || !token.isNSFW))
    )

  if (!tokens.length) {
    return (
      <div className={styles.feed_container}>
        <FeedToolbar
          feeds_menu={feeds_menu}
          hazards={hazards}
          filters={filterProps}
        />
        <div className={styles.empty_section}>
          <h1>{emptyMessage}</h1>
        </div>
      </div>
    )
  }

  const limitedTokens = tokens.slice(0, limit)

  return (
    <div className={`${styles.feed_container} no-fool`}>
      <FeedToolbar
        feeds_menu={feeds_menu}
        hazards={hazards}
        filters={filterProps}
      />
      <IconCache.Provider value={{}}>
        <InfiniteScroll
          className={`${styles.infinite_scroll} no-fool`}
          loadMore={() => {
            if (limit + itemsPerLoad > tokens.length && hasMorePages) {
              setSize(size + 1)
            }
            setSearchParams(
              {
                ...Object.fromEntries(searchParams),
                [namespace]: limit + itemsPerLoad,
              },
              { preventScrollReset: true }
            )
          }}
          hasMore={limit < tokens.length || (hasMorePages && !isValidating)}
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
