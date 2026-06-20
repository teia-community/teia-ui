import { useMemo } from 'react'
import { Loading } from '@atoms/loading'
import useSettings from '@hooks/use-settings'
import { useGlobalActivity } from '@data/swr'
import { resolveActivityEvent } from '@utils/activity'
import { ActivityList } from '@components/activity'
import styles from './teia-activity-feed.module.scss'

/**
 * Global Activity Tab
 */
export function GlobalActivityFeed() {
  const { walletBlockMap } = useSettings()
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
        .filter(Boolean),
    [events, walletBlockMap]
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
      <ActivityList
        rows={rows}
        onLoadMore={loadMore}
        isReachingEnd={isReachingEnd}
        isLoadingMore={isLoadingMore}
        emptyMessage="No recent activity."
      />
    </div>
  )
}

export default GlobalActivityFeed
