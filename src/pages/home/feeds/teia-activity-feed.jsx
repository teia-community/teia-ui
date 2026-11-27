import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import Tour, { TourLink } from '@components/tour'
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
import { useEmbeddedTokenNames } from '@components/activity/useEmbeddedTokenNames'
import { ACTIVITY_FEEDS } from '@constants'
import { useFeedReadStore } from '@context/feedReadStore'
import { useFeedNotifications } from '@data/feed-notifications'
import { useUserStore } from '@context/userStore'
import styles from './teia-activity-feed.module.scss'

const FEED_FILTERS = ACTIVITY_FILTERS.filter(
  (f) => !['buy', 'transfer'].includes(f.key)
)

const VIEWS = ACTIVITY_FEEDS

// Trades and Social each run their own tour once their data has loaded (the
// filters and table aren't on the page before that).
const TOURED_FEEDS = ['trades', 'social']

const TRADES_TOUR = [
  {
    target: 'activity-views',
    text: 'Pick a feed: trades, social posts, text, curations, calendar, copyright, wiki, polls, donations or the fountain.',
  },
  {
    target: 'activity-types',
    text: 'Show only some kinds of events. Pick several to combine them, or none to see everything.',
  },
  {
    target: 'activity-markets',
    text: 'Primary is the first sale by the artist. Secondary is a resale.',
  },
  {
    target: 'activity-table',
    text: 'Each row shows what happened, the item, who it went from and to, and the price. Click the time to see the transaction on tzkt.',
  },
]

const SOCIAL_TOUR = [
  {
    target: 'activity-views',
    text: 'Pick a feed: trades, social posts, text, curations, calendar, copyright, wiki, polls, donations or the fountain.',
  },
  {
    target: 'activity-social-kinds',
    text: 'Show only channel posts, poll comments or token comments. Pick none to see everything.',
  },
  {
    target: 'activity-social-table',
    text: 'Each row shows who posted, what they said and where. Click a link under Where to open it.',
  },
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
    resetKey: `trades:${type.active}:${market.active}:${sort}`,
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
      <Tour name="activity" steps={TRADES_TOUR} />
      <ActivityControls sort={sort} onSortChange={setSort}>
        <ActivityFilters
          active={type.active}
          onToggle={type.toggle}
          filters={FEED_FILTERS}
          tourTarget="activity-types"
        />
        <ActivityFilters
          active={market.active}
          onToggle={market.toggle}
          filters={MARKET_FILTERS}
          tourTarget="activity-markets"
        />
      </ActivityControls>

      <ActivityList
        rows={rows}
        onLoadMore={loadMore}
        isReachingEnd={isReachingEnd}
        isLoadingMore={isLoadingMore}
        tourTarget="activity-table"
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
  const tokenNames = useEmbeddedTokenNames(rows)

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
      <Tour name="activity" steps={SOCIAL_TOUR} />
      <ActivityControls sort={sort} onSortChange={setSort}>
        <ActivityFilters
          active={kind.active}
          onToggle={kind.toggle}
          filters={SOCIAL_FILTERS}
          tourTarget="activity-social-kinds"
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
            <div
              className={activityStyles.social_head}
              data-tour="activity-social-table"
            >
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
                tokenNames={tokenNames}
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
  const { pathname } = useLocation()
  const markSeen = useFeedReadStore((st) => st.markSeen)
  const address = useUserStore((st) => st.address)

  // Same check the menu dot reads, so the tabs say which feed moved while the
  // menu says only that something did. Sharing the cache key means naming the
  // feeds costs nothing beyond the check already made.
  const { unreadFeeds } = useFeedNotifications(address)

  // Looking at a feed is what marks it read, whether or not its dot was lit.
  const current = VIEWS.find((v) => pathname.startsWith(`/activity/${v.key}`))
  const currentKey = current?.key
  useEffect(() => {
    if (currentKey) markSeen(currentKey)
  }, [currentKey, markSeen])

  return (
    <div className={styles.feed}>
      <p className={styles.notice}>
        Feed notifications are off by default. Go to your{' '}
        <Link to="/settings">settings</Link> to turn them on, if interested.
      </p>
      <div className={styles.view_toggle} data-tour="activity-views">
        {VIEWS.map((v) => (
          <NavLink
            key={v.key}
            to={`/activity/${v.key}`}
            className={({ isActive }) =>
              `${styles.view_chip} ${isActive ? styles.view_chip_active : ''}`
            }
          >
            {v.label}
            {unreadFeeds.includes(v.key) && (
              <>
                <span className={styles.tab_dot} aria-hidden="true" />
                <span className={styles.visually_hidden}> (unread)</span>
              </>
            )}
          </NavLink>
        ))}
        {TOURED_FEEDS.includes(currentKey) && (
          <span className={styles.tour}>
            <TourLink name="activity" title="How activity works" />
          </span>
        )}
      </div>

      <Outlet />
    </div>
  )
}

export default GlobalActivityFeed
