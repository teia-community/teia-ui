import { Button } from '@atoms/button'
import { ActivityRow } from './ActivityRow'
import styles from './list.module.scss'

/**
 * Activity List with "Load more" button.
 * `tourTarget`: `data-tour` target for the header row (see components/tour).
 */
export function ActivityList({
  rows,
  onLoadMore,
  isReachingEnd,
  isLoadingMore,
  emptyMessage = 'No activity yet.',
  tourTarget,
}) {
  if (!rows.length) {
    return (
      <div className={styles.empty}>
        <p>{emptyMessage}</p>
        {/* Nothing matched yet, but older pages may: keep a way to look. */}
        {onLoadMore && !isReachingEnd && (
          <Button shadow_box onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Search older activity'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={styles.scroll}>
        <div className={styles.head} data-tour={tourTarget}>
          <span>Event</span>
          <span>Item</span>
          <span>From</span>
          <span>To</span>
          <span className={styles.num}>Amount</span>
          <span className={styles.num}>Price</span>
          <span className={styles.num}>Time</span>
        </div>
        {rows.map(({ event, meta }) => (
          <ActivityRow key={event.id} event={event} meta={meta} />
        ))}
      </div>

      {onLoadMore && !isReachingEnd && (
        <div className={styles.more}>
          <Button shadow_box onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </>
  )
}

export default ActivityList
