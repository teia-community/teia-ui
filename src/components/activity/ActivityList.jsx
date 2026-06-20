import { Button } from '@atoms/button'
import { ActivityRow } from './ActivityRow'
import styles from './list.module.scss'

/**
 * Activity List with "Load more" button.
 *
 */
export function ActivityList({
  rows,
  onLoadMore,
  isReachingEnd,
  isLoadingMore,
  emptyMessage = 'No activity yet.',
}) {
  if (!rows.length) {
    return (
      <div className={styles.empty}>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.scroll}>
        <div className={styles.head}>
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
