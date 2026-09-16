import { useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import useSettings from '@hooks/use-settings'
import useActivityFilter from '@hooks/use-activity-filter'
import useAutoLoadMore from '@hooks/use-auto-load-more'
import { useGlobalActivity } from '@data/swr'
import { useSocialActivity } from '@data/messaging/useSocialActivity'
import { useUserProfiles } from '@data/roles'
import {
  resolveActivityEvent,
  ACTIVITY_FILTERS,
  MARKET_FILTERS,
  SOCIAL_FILTERS,
} from '@utils/activity'
import {
  ActivityList,
  ActivityFilters,
  ActivityControls,
  SocialActivityRow,
} from '@components/activity'
import activityStyles from '@components/activity/index.module.scss'
import styles from './teia-activity-feed.module.scss'

const FEED_FILTERS = ACTIVITY_FILTERS.filter(
  (f) => !['buy', 'transfer'].includes(f.key)
)

const VIEWS = [
  { key: 'social', label: 'Social' },
  { key: 'trades', label: 'Trades' },
  { key: 'text', label: 'Text' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'copyright', label: 'Copyright' },
  { key: 'wiki', label: 'Wiki' },
]

/** Trade activity (sales/mints/listings/transfers) — the original feed. */
export function TradesFeed() {
  const { walletBlockMap } = useSettings()
  const type = useActivityFilter()
  const market = useActivityFilter()
  const [sort, setSort] = useState('newest')
  const { matches: matchesType } = type
  const { matches: matchesMarket } = market
  const {
    events,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useGlobalActivity(type.active, sort)

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

  useAutoLoadMore({
    rowCount: rows.length,
    isLoadingInitial,
    isReachingEnd,
    isLoadingMore,
    loadMore,
  })

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
    <>
      <ActivityControls sort={sort} onSortChange={setSort}>
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
      </ActivityControls>

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
    </>
  )
}

/**
 * Social activity: public channel posts + poll/token comments.
 * Mounted only when the Social view is active, so its hooks don't fetch up front.
 */
export function SocialFeed() {
  const kind = useActivityFilter()
  const [sort, setSort] = useState('newest')
  const { matches } = kind
  const {
    items,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useSocialActivity(sort)

  const senders = useMemo(
    () => [...new Set(items.map((i) => i.sender))],
    [items]
  )
  const { data: profiles = {} } = useUserProfiles(senders)

  const rows = useMemo(
    () => items.filter((i) => matches(i.kind)),
    [items, matches]
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
    <>
      <ActivityControls sort={sort} onSortChange={setSort}>
        <ActivityFilters
          active={kind.active}
          onToggle={kind.toggle}
          filters={SOCIAL_FILTERS}
        />
      </ActivityControls>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>
            No recent activity
            {kind.active.length > 0 ? ' for this filter' : ''}.
          </p>
        </div>
      ) : (
        <>
          <div className={activityStyles.social_scroll}>
            <div className={activityStyles.social_head}>
              <span>Type</span>
              <span>Author</span>
              <span>Content</span>
              <span>Where</span>
              <span className={activityStyles.num}>Time</span>
            </div>
            {rows.map((item) => (
              <SocialActivityRow
                key={item.id}
                item={item}
                senderName={profiles[item.sender]?.alias}
              />
            ))}
          </div>

          {!isReachingEnd && (
            <div className={activityStyles.social_more}>
              <Button shadow_box onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}

/**
 * Global Activity layout, each feed is a route now
 */
export function GlobalActivityFeed() {
  return (
    <div className={styles.feed}>
      <div className={styles.view_toggle}>
        {VIEWS.map((v) => (
          <NavLink
            key={v.key}
            to={`/activity/${v.key}`}
            className={({ isActive }) =>
              `${styles.view_chip} ${isActive ? styles.view_chip_active : ''}`
            }
          >
            {v.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}

export default GlobalActivityFeed
