import { useMemo } from 'react'
import { Loading } from '@atoms/loading'
import useSettings from '@hooks/use-settings'
import useActivityFilter from '@hooks/use-activity-filter'
import { useGlobalActivity } from '@data/swr'
import { resolveActivityEvent, ACTIVITY_FILTERS } from '@utils/activity'
import { ActivityList, ActivityFilters } from '@components/activity'
import styles from './teia-activity-feed.module.scss'

// Drop the "buy" filer, not needed here.
const FEED_FILTERS = ACTIVITY_FILTERS.filter((f) => f.key !== 'buy')

/**
 * Global Activity Tab
 */
export function GlobalActivityFeed() {
  const { walletBlockMap } = useSettings()
  const { active, toggle, matches } = useActivityFilter()
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
        .filter(({ meta }) => matches(meta.filterKey)),
    [events, walletBlockMap, matches]
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
        active={active}
        onToggle={toggle}
        filters={FEED_FILTERS}
      />

      <ActivityList
        rows={rows}
        onLoadMore={loadMore}
        isReachingEnd={isReachingEnd}
        isLoadingMore={isLoadingMore}
        emptyMessage={`No recent activity${
          active.length > 0 ? ' for this filter' : ''
        }.`}
      />
    </div>
  )
}

export default GlobalActivityFeed
