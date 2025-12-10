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
import { useUserStore } from '@context/userStore'

import { NFT } from '@types'

interface ViewProps {
  tokens: NFT[]
}

/**
 * Single view, vertical feed
 */
function SingleView({ tokens }: ViewProps) {
  return (
    <div className={`${styles.single_view} no-fool`}>
      {tokens.map((token) => (
        <FeedItem key={token.token_id} nft={token} />
      ))}
    </div>
  )
}

/**
 * Masonry view feed
 */
function MasonryView({ tokens }: ViewProps) {
  return (
    <ResponsiveMasonry>
      {tokens.map((token) => (
        <FeedItem key={(token as any).key || token.token_id} nft={token} />
      ))}
    </ResponsiveMasonry>
  )
}

interface ExtractTokensParams {
  postProcessTokens: (tokens: any[]) => any[]
  resultsPath: string
  tokenPath: string
  keyPath: string
}

interface TokenCollectionProps {
  query: string | any
  label?: string
  namespace?: string
  showRestricted?: boolean
  overrideProtections?: boolean
  feeds_menu?: boolean
  disable?: boolean
  variables?: Record<string, any>
  swrParams?: any[]
  itemsPerLoad?: number
  maxItems?: number
  resultsPath?: string
  tokenPath?: string
  keyPath?: string
  emptyMessage?: string
  postProcessTokens?: (tokens: any[]) => any[]
  extractTokensFromResponse?: (data: any, params: ExtractTokensParams) => any[]
}

/**
 * Main feed component that can be either in Single or Masonry mode.
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
      get(data, resultsPath).map((result: any) => ({
        ...(tokenPath ? get(result, tokenPath) : result),
        key: get(result, keyPath),
      }))
    )
  },
}: TokenCollectionProps) {
  const [user_address] = useUserStore((state) => [state.address])
  const [searchParams, setSearchParams] = useSearchParams()
  const { walletBlockMap, nsfwMap, photosensitiveMap, objktBlockMap } =
    useSettings()

  const [viewMode, toggleViewMode, toggleZen] = useLocalSettings(
    (state) => [state.viewMode, state.toggleViewMode, state.toggleZen],
    shallow
  )
  useKeyboard('v', toggleViewMode)
  useKeyboard('z', toggleZen)

  const limit = searchParams.get(namespace || '')
    ? parseInt(searchParams.get(namespace || '') || '0', 10)
    : itemsPerLoad

  const { data, error } = useSWR(
    disable ? null : [namespace, ...swrParams],
    async (ns: any) => {
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
    } as any)
  }

  const tokens = extractTokensFromResponse(data, {
    postProcessTokens,
    resultsPath,
    tokenPath,
    keyPath,
  })
    .filter((token: any) =>
      showRestricted
        ? true
        : walletBlockMap.get(token.artist_address) !== 1 &&
        objktBlockMap.get(token.id) !== 1
    )
    .map((token: any) => {
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
          token.artist_address === user_address,
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
    <div className={`${styles.feed_container} no-fool`}>
      <FeedToolbar feeds_menu={feeds_menu} />
      <IconCache.Provider value={{}}>
        <InfiniteScroll
          className={`${styles.infinite_scroll} no-fool`}
          loadMore={() => {
            const newParams: Record<string, string> = {}
            searchParams.forEach((value, key) => {
              newParams[key] = value
            })
            newParams[namespace || ''] = String(limit + itemsPerLoad)
            setSearchParams(newParams, { preventScrollReset: true })
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
