import { useMemo } from 'react'
import { Loading } from '@atoms/loading'
import useSettings from '@hooks/use-settings'
import useActivityFilter from '@hooks/use-activity-filter'
import { useGlobalActivity } from '@data/swr'
import {
  resolveActivityEvent,
  ACTIVITY_FILTERS,
  MARKET_FILTERS,
} from '@utils/activity'
import { ActivityList, ActivityFilters } from '@components/activity'
import styles from './teia-activity-feed.module.scss'

// Drop the "buy" filer, not needed here.
const FEED_FILTERS = ACTIVITY_FILTERS.filter((f) => f.key !== 'buy')

/**
 * Global Activity Tab
 */
export function GlobalActivityFeed() {
  const { walletBlockMap } = useSettings()
  const type = useActivityFilter()
  const market = useActivityFilter()
  const { matches: matchesType } = type
  const { matches: matchesMarket } = market
  const {
    events,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useGlobalActivity()

  const rows = useMemo(
    () =>
      events
        .filter(
          (event) => walletBlockMap?.get(event.token?.artist_address) !== 1
        )
        .map((event) => {
          const meta = resolveActivityEvent(event, null)
          return meta ? { event, meta } : null
        })
        .filter(Boolean)
        .filter(
          ({ meta }) =>
            matchesType(meta.filterKey) && matchesMarket(meta.marketKey)
        ),
    [events, walletBlockMap, matchesType, matchesMarket]
  )

  if (error) {
    return (
      <div className={styles.empty}>
        <p>Error loading activity: {error.message}</p>
      </div>
    )
  }

  if (isLoadingInitial) {
    return <Loading message="Loading Teia activity" />
  }

  return (
    <div className={styles.feed}>
      <ActivityFilters
        active={type.active}
        onToggle={type.toggle}
        filters={FEED_FILTERS}
      />
      <ActivityFilters
        active={market.active}
        onToggle={market.toggle}
        filters={MARKET_FILTERS}
      />

      <ActivityList
        rows={rows}
        onLoadMore={loadMore}
        isReachingEnd={isReachingEnd}
        isLoadingMore={isLoadingMore}
        emptyMessage={`No recent activity${
          type.active.length > 0 || market.active.length > 0
            ? ' for this filter'
            : ''
        }.`}
      />
    </div>
  )
}

export default GlobalActivityFeed
