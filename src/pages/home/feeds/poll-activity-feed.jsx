import { useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import useActivityFilter from '@hooks/use-activity-filter'
import { usePollActivity, POLL_ACTIVITY_FILTERS } from '@data/poll-activity'
import { useUserProfiles } from '@data/roles'
import {
  ActivityFilters,
  ActivityControls,
  ActionRow,
} from '@components/activity'
import activityStyles from '@components/activity/index.module.scss'
import styles from './teia-activity-feed.module.scss'

const ACTION_META = {
  poll_created: { label: 'Poll', color: 'create' },
  poll_voted: { label: 'Vote', color: 'poll' },
  poll_commented: { label: 'Comment', color: 'channel' },
}

/** Polls created, votes cast on them, and comments left on them. */
export function PollsActivityFeed() {
  const action = useActivityFilter()
  const [sort, setSort] = useState('newest')
  const { items, error, isLoadingInitial, isReachingEnd, loadMore } =
    usePollActivity(action.active, sort)

  const actors = useMemo(
    () => [...new Set(items.map((i) => i.actor).filter(Boolean))],
    [items]
  )
  const { data: profiles = {} } = useUserProfiles(actors)

  if (error) {
    return (
      <div className={styles.empty}>
        <p>Error loading poll activity: {error.message}</p>
      </div>
    )
  }

  if (isLoadingInitial) {
    return <Loading message="Loading poll activity" />
  }

  return (
    <>
      <ActivityControls sort={sort} onSortChange={setSort}>
        <ActivityFilters
          active={action.active}
          onToggle={action.toggle}
          filters={POLL_ACTIVITY_FILTERS}
        />
      </ActivityControls>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>
            No poll activity
            {action.active.length > 0 ? ' for this filter' : ''} yet.
          </p>
        </div>
      ) : (
        <div className={activityStyles.social_scroll}>
          <div className={activityStyles.action_head}>
            <span>Action</span>
            <span>By</span>
            <span>Poll</span>
            <span className={activityStyles.num}>Time</span>
          </div>
          {items.map((item) => (
            <ActionRow
              key={item.id}
              {...ACTION_META[item.action]}
              actor={item.actor}
              actorName={profiles[item.actor]?.alias}
              timestamp={item.timestamp}
              to={item.pollId ? `/poll/${item.pollId}` : null}
              targetLabel={
                item.question
                  ? `#${item.pollId} ${item.question}`
                  : `Poll #${item.pollId}`
              }
              href={item.ophash ? `https://tzkt.io/${item.ophash}` : null}
            />
          ))}
        </div>
      )}

      {!isReachingEnd && (
        <div className={activityStyles.social_more}>
          <Button shadow_box onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </>
  )
}

export default PollsActivityFeed
