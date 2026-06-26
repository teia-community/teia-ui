import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { useUserActivity } from '@data/swr'
import useActivityFilter from '@hooks/use-activity-filter'
import { resolveActivityEvent, MARKET_FILTERS } from '@utils/activity'
import { ActivityList, ActivityFilters } from '@components/activity'
import styles from './activity.module.scss'

export default function Activity() {
  const { address } = useOutletContext()

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
  } = useUserActivity(address)

  const rows = useMemo(
    () =>
      events
        .map((event) => {
          const meta = resolveActivityEvent(event, address)
          return meta ? { event, meta } : null
        })
        .filter(Boolean)
        .filter(
          ({ meta }) =>
            matchesType(meta.filterKey) && matchesMarket(meta.marketKey)
        ),
    [events, address, matchesType, matchesMarket]
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
      <ActivityFilters active={type.active} onToggle={type.toggle} />
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
        emptyMessage={`No activity${
          type.active.length > 0 || market.active.length > 0
            ? ' for this filter'
            : ''
        } yet.`}
      />
    </div>
  )
}
