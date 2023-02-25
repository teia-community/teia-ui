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

import type { RequestDocument } from 'graphql-request'
import type { NFT } from '@types'
import type { getSdkWithHooks } from 'gql'

/** Single view, vertical feed */
function SingleView({ tokens }: { tokens: NFT[] }) {
  return (
    <div className={styles.single_view}>
      {tokens.map((token) => (
        <FeedItem key={token.token_id} nft={token} />
      ))}
    </div>
  )
}

/*** Masonry view feed*/
function MasonryView({ tokens }: { tokens: NFT[] }) {
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

// TODO (mel): Avoid pop drilling feeds_menu, once the context will be cleaner we could maybe introduce smaller contexts, one could be the "profile" context
// /**

type Query = keyof ReturnType<typeof getSdkWithHooks>

interface TokenCollectionProps<ResponseData, TokensReturnType> {
  query: RequestDocument | Query
  label: string
  namespace: string
  extractTokensFromResponse: (
    data: ResponseData,
    opts: PostProcess<TokensReturnType>
  ) => TokensReturnType
}

interface PostProcess<TokensReturnType> {
  postProcessTokens: (
    resultsPath: string,
    tokenPath: string,
    keyPath: string
  ) => TokensReturnType
  resultsPath: string
  tokenPath: string
  keyPath: string
}

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
}: TokenCollectionProps) {
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
        ? request(import.meta.env.VITE_TEIA_GRAPHQL_API, query, {
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
    return (
      <div className={styles.feed_container}>
        <FeedToolbar feeds_menu={feeds_menu} />
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
      }
    })

  if (!tokens.length) {
    return (
      <div className={styles.feed_container}>
        <FeedToolbar feeds_menu={feeds_menu} />
        <div className={styles.empty_section}>
          <h1>{emptyMessage}</h1>
        </div>
      </div>
    )
  }

  const limitedTokens = tokens.slice(0, limit)

  return (
    <div className={styles.feed_container}>
      <FeedToolbar feeds_menu={feeds_menu} />
      <IconCache.Provider value={{}}>
        <InfiniteScroll
          className={`${styles.infinite_scroll}`}
          loadMore={() => {
            setSearchParams(
              {
                ...Object.fromEntries(searchParams),
                [namespace]: limit + itemsPerLoad,
              },
              { preventScrollReset: true }
            )
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
