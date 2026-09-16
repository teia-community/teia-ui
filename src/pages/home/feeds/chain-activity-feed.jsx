import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { CALENDAR_CONTRACT, WIKI_CONTRACT } from '@constants'
import useActivityFilter from '@hooks/use-activity-filter'
import {
  useChainActivity,
  useCopyrightActivity,
  CHAIN_ACTIVITY_FILTERS,
} from '@data/chain-activity'
import { useUserProfiles } from '@data/roles'
import { useWiki } from '@data/wiki'
import { fetchEvents, fetchEventContent } from '@data/calendar-chain'
import {
  ActivityFilters,
  ActivityControls,
  ActionRow,
} from '@components/activity'
import activityStyles from '@components/activity/index.module.scss'
import styles from './teia-activity-feed.module.scss'

const ACTION_META = {
  created: { label: 'Created', color: 'create' },
  updated: { label: 'Edited', color: 'list' },
  proposed: { label: 'Proposed', color: 'poll' },
  accepted: { label: 'Accepted', color: 'sale' },
  declined: { label: 'Declined', color: 'transfer' },
}

const CALENDAR = {
  ns: 'calendar',
  contract: CALENDAR_CONTRACT,
  itemPrefix: 'event',
  itemLabel: 'Event',
  itemTo: (id) => `/calendar/event/chain-${id}`,
}

const WIKI = {
  ns: 'wiki',
  contract: WIKI_CONTRACT,
  itemPrefix: 'page',
  itemLabel: 'Page',
  itemTo: (id) => `/wiki/${id}`,
}

function present(item, config, targetOf) {
  const meta =
    item.action === 'hidden'
      ? { label: item.hidden ? 'Hidden' : 'Unhidden', color: 'burn' }
      : ACTION_META[item.action]

  let to = null
  let targetLabel
  if (item.targetId != null) {
    const custom = targetOf?.(item.targetId)
    to = custom?.to ?? config.itemTo(item.targetId)
    targetLabel = custom?.label ?? `${config.itemLabel} #${item.targetId}`
  } else if (item.isNew) {
    targetLabel = `New ${config.itemLabel.toLowerCase()} proposal`
  } else if (item.proposalId != null) {
    targetLabel = `Proposal #${item.proposalId}`
  } else {
    targetLabel = '—'
  }

  return { ...meta, to, targetLabel }
}

function ChainFeed({ config, targetOf, loadingMessage }) {
  const action = useActivityFilter()
  const [sort, setSort] = useState('newest')
  const {
    items,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useChainActivity(config, action.active, sort)

  const actors = useMemo(
    () => [...new Set(items.map((i) => i.actor).filter(Boolean))],
    [items]
  )
  const { data: profiles = {} } = useUserProfiles(actors)

  if (error) {
    return (
      <div className={styles.empty}>
        <p>Error loading activity: {error.message}</p>
      </div>
    )
  }

  if (isLoadingInitial) {
    return <Loading message={loadingMessage} />
  }

  return (
    <>
      <ActivityControls sort={sort} onSortChange={setSort}>
        <ActivityFilters
          active={action.active}
          onToggle={action.toggle}
          filters={CHAIN_ACTIVITY_FILTERS}
        />
      </ActivityControls>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>
            No activity
            {action.active.length > 0 ? ' for this filter' : ''} yet.
          </p>
        </div>
      ) : (
        <>
          <div className={activityStyles.social_scroll}>
            <div className={activityStyles.action_head}>
              <span>Action</span>
              <span>By</span>
              <span>Item</span>
              <span className={activityStyles.num}>Time</span>
            </div>
            {items.map((item) => (
              <ActionRow
                key={item.id}
                {...present(item, config, targetOf)}
                actor={item.actor}
                actorName={profiles[item.actor]?.alias}
                timestamp={item.timestamp}
                href={item.ophash ? `https://tzkt.io/${item.ophash}` : null}
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

function useCalendarTitles() {
  const { data } = useSWR(
    'chain-activity:calendar-titles',
    async () => {
      const events = await fetchEvents()
      const docs = await Promise.allSettled(
        events.map((e) => fetchEventContent(e.cid))
      )
      const titles = {}
      events.forEach((e, i) => {
        if (docs[i].status === 'fulfilled' && docs[i].value?.title) {
          titles[e.id] = docs[i].value.title
        }
      })
      return titles
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )
  return data
}

export function CalendarActivityFeed() {
  const titles = useCalendarTitles()
  const targetOf = useCallback(
    (id) => {
      const title = titles?.[id]
      return title ? { label: title, to: `/calendar/event/chain-${id}` } : null
    },
    [titles]
  )

  return (
    <ChainFeed
      config={CALENDAR}
      targetOf={targetOf}
      loadingMessage="Loading calendar activity"
    />
  )
}

export function WikiActivityFeed() {
  const { data: wiki } = useWiki()
  const targetOf = useCallback(
    (id) => {
      const meta = wiki?.meta?.[id]
      if (!meta) return null
      return { label: meta.title, to: `/wiki/${meta.slug || id}` }
    },
    [wiki]
  )

  return (
    <ChainFeed
      config={WIKI}
      targetOf={targetOf}
      loadingMessage="Loading wiki activity"
    />
  )
}

export function CopyrightActivityFeed() {
  const [sort, setSort] = useState('newest')
  const {
    items,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useCopyrightActivity(sort)

  const actors = useMemo(
    () => [...new Set(items.map((i) => i.actor).filter(Boolean))],
    [items]
  )
  const { data: profiles = {} } = useUserProfiles(actors)

  if (error) {
    return (
      <div className={styles.empty}>
        <p>Error loading activity: {error.message}</p>
      </div>
    )
  }

  if (isLoadingInitial) {
    return <Loading message="Loading copyright activity" />
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No copyright agreements yet.</p>
      </div>
    )
  }

  return (
    <>
      {/* No filter chips on this feed — the sort control stands alone. */}
      <ActivityControls sort={sort} onSortChange={setSort} />

      <div className={activityStyles.social_scroll}>
        <div className={activityStyles.action_head}>
          <span>Action</span>
          <span>By</span>
          <span>Item</span>
          <span className={activityStyles.num}>Time</span>
        </div>
        {items.map((item) => (
          <ActionRow
            key={item.id}
            label="Created"
            color="create"
            actor={item.actor}
            actorName={profiles[item.actor]?.alias}
            to={item.actor ? `/tz/${item.actor}/copyrights` : null}
            targetLabel={
              item.agreementId != null
                ? `Agreement #${item.agreementId}`
                : 'Agreement'
            }
            timestamp={item.timestamp}
            href={item.level != null ? `https://tzkt.io/${item.level}` : null}
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
