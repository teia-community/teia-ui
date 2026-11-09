import { useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { DAO_TREASURY_CONTRACT, TEIA_FOUNTAIN_CONTRACT } from '@constants'
import { useDonationTimeline } from '@data/donation-activity'
import useAutoLoadMore from '@hooks/use-auto-load-more'
import { useUserProfiles } from '@data/roles'
import { TopDonors } from '@components/dao/TopDonors'
import { FountainDonors } from '@components/dao/FountainDonors'
import { ActivityControls, ActionRow } from '@components/activity'
import activityStyles from '@components/activity/index.module.scss'
import filterStyles from '@components/activity/filters.module.scss'
import styles from './teia-activity-feed.module.scss'

const VIEWS = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'amount', label: 'By amount' },
]

/** Tez, the way the donations page writes it. */
function formatAmount(amount) {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ꜩ`
}

function DonationTimeline({ contract, emptyMessage, loadingMessage }) {
  const [sort, setSort] = useState('newest')
  const {
    items,
    error,
    isLoadingInitial,
    isLoadingMore,
    isReachingEnd,
    loadMore,
  } = useDonationTimeline(contract, sort)

  // Most transfers into these contracts are marketplace fees and payout
  // wallets, which are not donations, so a page can filter down to nothing
  // while real donations sit further back.
  useAutoLoadMore({
    rowCount: items.length,
    isLoadingInitial,
    isReachingEnd,
    isLoadingMore,
    loadMore,
    resetKey: `${contract}:${sort}`,
  })

  const donors = useMemo(
    () => [...new Set(items.map((i) => i.sender).filter(Boolean))],
    [items]
  )
  const { data: profiles = {} } = useUserProfiles(donors)

  if (error) {
    return (
      <div className={styles.empty}>
        <p>Error loading donations: {error.message}</p>
      </div>
    )
  }

  if (isLoadingInitial) {
    return <Loading message={loadingMessage} />
  }

  return (
    <>
      <ActivityControls sort={sort} onSortChange={setSort} />

      {items.length === 0 && isReachingEnd ? (
        <div className={styles.empty}>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className={activityStyles.social_scroll}>
            <div className={activityStyles.action_head}>
              <span>Action</span>
              <span>From</span>
              <span>Amount</span>
              <span className={activityStyles.num}>Time</span>
            </div>
            {items.map((item) => (
              <ActionRow
                key={item.id}
                label="Donation"
                color="sale"
                actor={item.sender}
                actorName={profiles[item.sender]?.alias || item.senderAlias}
                targetLabel={formatAmount(item.amount)}
                timestamp={item.timestamp}
                href={`https://tzkt.io/${item.ophash}`}
              />
            ))}
          </div>

          {items.length === 0 && !isReachingEnd && (
            <div className={styles.empty}>
              <p>Looking further back for donations…</p>
            </div>
          )}

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

/** Timeline / by-amount switch shared by both donation feeds. */
function DonationFeed({ contract, emptyMessage, loadingMessage, totals }) {
  const [view, setView] = useState('timeline')

  return (
    <>
      <div className={filterStyles.filters}>
        {VIEWS.map((v) => (
          <button
            type="button"
            key={v.key}
            className={`${filterStyles.chip} ${
              view === v.key ? filterStyles.chip_active : ''
            }`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'timeline' ? (
        <DonationTimeline
          contract={contract}
          emptyMessage={emptyMessage}
          loadingMessage={loadingMessage}
        />
      ) : (
        totals
      )}
    </>
  )
}

/** Donations to the Teia DAO treasury. */
export function DonationsActivityFeed() {
  return (
    <DonationFeed
      contract={DAO_TREASURY_CONTRACT}
      emptyMessage="No donations yet."
      loadingMessage="Loading donations"
      totals={<TopDonors limit={100} />}
    />
  )
}

/** Donations to the Teia fountain. */
export function FountainActivityFeed() {
  return (
    <DonationFeed
      contract={TEIA_FOUNTAIN_CONTRACT}
      emptyMessage="No fountain donations yet."
      loadingMessage="Loading fountain donations"
      totals={<FountainDonors limit={100} />}
    />
  )
}

export default DonationsActivityFeed
