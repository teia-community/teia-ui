import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { useUserActivity } from '@data/swr'
import useActivityFilter from '@hooks/use-activity-filter'
import { resolveActivityEvent } from '@utils/activity'
import { ActivityList, ActivityFilters } from '@components/activity'
import styles from './activity.module.scss'

export default function Activity() {
  const { address } = useOutletContext()

  const { active, toggle, matches } = useActivityFilter()

  const {
    events,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useUserActivity(address)

  const rows = useMemo(
    () =>
      events
        .map((event) => {
          const meta = resolveActivityEvent(event, address)
          return meta ? { event, meta } : null
        })
        .filter(Boolean)
        .filter(({ meta }) => matches(meta.filterKey)),
    [events, address, matches]
  )

  if (error) {
    return (
      <div className={styles.empty}>
        <p>Error loading activity: {error.message}</p>
      </div>
    )
  }

  if (isLoadingInitial) {
    return <Loading message="Loading activity" />
  }

  return (
    <div className={styles.activity}>
      <ActivityFilters active={active} onToggle={toggle} />

      <ActivityList
        rows={rows}
        onLoadMore={loadMore}
        isReachingEnd={isReachingEnd}
        isLoadingMore={isLoadingMore}
        emptyMessage={`No activity${
          active.length > 0 ? ' for this filter' : ''
        } yet.`}
      />
    </div>
  )
}
