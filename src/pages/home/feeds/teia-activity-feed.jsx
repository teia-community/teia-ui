import { useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import useSettings from '@hooks/use-settings'
import useActivityFilter from '@hooks/use-activity-filter'
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
  SocialActivityRow,
} from '@components/activity'
import activityStyles from '@components/activity/index.module.scss'
import styles from './teia-activity-feed.module.scss'

// Drop the "buy" filer, not needed here.
const FEED_FILTERS = ACTIVITY_FILTERS.filter((f) => f.key !== 'buy')

const VIEWS = [
  { key: 'trades', label: 'Trades' },
  { key: 'social', label: 'Social' },
]

/** Trade activity (sales/mints/listings/transfers) — the original feed. */
function TradesFeed() {
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
    <>
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
    </>
  )
}

/**
 * Social activity: public channel posts + poll/token comments.
 * Mounted only when the Social view is active, so its hooks don't fetch up front.
 */
function SocialFeed() {
  const kind = useActivityFilter()
  const { matches } = kind
  const {
    items,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useSocialActivity()

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
      <ActivityFilters
        active={kind.active}
        onToggle={kind.toggle}
        filters={SOCIAL_FILTERS}
      />

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
 * Global Activity Tab — a Trades / Social view switch over the platform feed.
 */
export function GlobalActivityFeed() {
  const [view, setView] = useState('trades')

  return (
    <div className={styles.feed}>
      <div className={styles.view_toggle}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={`${styles.view_chip} ${
              view === v.key ? styles.view_chip_active : ''
            }`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'trades' ? <TradesFeed /> : <SocialFeed />}
    </div>
  )
}

export default GlobalActivityFeed
