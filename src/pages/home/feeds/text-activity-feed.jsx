import { useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import useSettings from '@hooks/use-settings'
import useActivityFilter from '@hooks/use-activity-filter'
import useAutoLoadMore from '@hooks/use-auto-load-more'
import { useTextActivity } from '@data/swr'
import { useTextCommentActivity } from '@data/messaging/useTextCommentActivity'
import { useUserProfiles } from '@data/roles'
import {
  resolveActivityEvent,
  ACTIVITY_FILTERS,
  MARKET_FILTERS,
} from '@utils/activity'
import {
  ActivityList,
  ActivityFilters,
  ActivityControls,
  SocialActivityRow,
} from '@components/activity'
import activityStyles from '@components/activity/index.module.scss'
import styles from './teia-activity-feed.module.scss'

// Mint / listing / sale of text posts
const TEXT_FILTERS = ACTIVITY_FILTERS.filter((f) =>
  ['sale', 'list', 'create'].includes(f.key)
)

/** Comments posted on text tokens */
function TextComments({ sort }) {
  const {
    items,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useTextCommentActivity(sort)

  const senders = useMemo(
    () => [...new Set(items.map((i) => i.sender))],
    [items]
  )
  const { data: profiles = {} } = useUserProfiles(senders)

  useAutoLoadMore({
    rowCount: items.length,
    isLoadingInitial,
    isReachingEnd,
    isLoadingMore,
    loadMore,
  })

  if (error) {
    return (
      <div className={styles.empty}>
        <p>Error loading comments: {error.message}</p>
      </div>
    )
  }

  if (isLoadingInitial) {
    return <Loading message="Loading comments" />
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No comments on text posts yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className={activityStyles.social_scroll}>
        <div className={activityStyles.social_head}>
          <span>Type</span>
          <span>Author</span>
          <span>Content</span>
          <span>Where</span>
          <span className={activityStyles.num}>Time</span>
        </div>
        {items.map((item) => (
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
  )
}

/**
 * Text-post activity (/activity/text): mints, listings and sales of
 * text/plain + text/markdown tokens, plus the comments posted on them.
 */
export function TextActivityFeed() {
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
  } = useTextActivity(type.active, sort)

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
    return <Loading message="Loading text activity" />
  }

  return (
    <>
      <ActivityControls sort={sort} onSortChange={setSort}>
        <ActivityFilters
          active={type.active}
          onToggle={type.toggle}
          filters={TEXT_FILTERS}
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
        emptyMessage={`No text post activity${
          type.active.length > 0 || market.active.length > 0
            ? ' for this filter'
            : ''
        } yet.`}
      />

      <h2 className={styles.section_heading}>Comments</h2>
      <TextComments sort={sort} />
    </>
  )
}

export default TextActivityFeed
