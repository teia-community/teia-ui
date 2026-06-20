import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { useUserActivity } from '@data/swr'
import { resolveActivityEvent, ACTIVITY_FILTERS } from '@utils/activity'
import { ActivityList } from '@components/activity'
import styles from './activity.module.scss'

export default function Activity() {
  const { address } = useOutletContext()

  const [active, setActive] = useState([])

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
          ({ meta }) => active.length === 0 || active.includes(meta.filterKey)
        ),
    [events, address, active]
  )

  const toggle = (key) =>
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
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
      <div className={styles.filters}>
        {ACTIVITY_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.chip} ${
              active.includes(f.key) ? styles.chip_active : ''
            }`}
            onClick={() => toggle(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

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
