import { useMemo, useState } from 'react'
import { useTopDonors } from '@data/swr'
import {
  DONATION_EXCLUDED_ADDRESSES,
  TZKT_API_URL,
  DAO_TREASURY_CONTRACT,
} from '@constants'
import styles from './TopDonors.module.scss'

export function TopDonors({
  limit: initialLimit = 10,
  excludeAddresses = DONATION_EXCLUDED_ADDRESSES,
}) {
  const [displayLimit, setDisplayLimit] = useState(initialLimit)
  const { data: donators, isLoading, error } = useTopDonors(excludeAddresses)

  const allDonors = useMemo(() => {
    if (!donators) return []

    return donators.map((donor) => ({
      address: donor.donator_address,
      alias: donor.donator_alias,
      totalAmount: donor.total_donated_tez,
      donationCount: donor.transaction_count,
      firstDonation: donor.first_donation,
      lastDonation: donor.last_donation,
    }))
  }, [donators])

  const displayedDonors = useMemo(() => {
    return allDonors.slice(0, displayLimit)
  }, [allDonors, displayLimit])

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + initialLimit)
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading donations...</div>
  }

  if (error) {
    return <div className={styles.error}>Error loading donations</div>
  }

  if (!displayedDonors || displayedDonors.length === 0) {
    return <div className={styles.empty}>No donations found</div>
  }

  const hasMore = allDonors.length > displayLimit

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Top Donors</h3>
      <div className={styles.list}>
        {displayedDonors.map((donor, index) => (
          <div key={donor.address} className={styles.donor}>
            <div className={styles.rank}>{index + 1}</div>
            <div className={styles.info}>
              <div className={styles.name}>
                <a
                  href={`https://tzkt.io/${donor.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View ${donor.alias || donor.address} profile on TzKT`}
                >
                  {donor.alias || `${donor.address.slice(0, 8)}...`}
                </a>
              </div>
              <div className={styles.address}>
                <a
                  href={`${TZKT_API_URL}/operations/transactions?target=${DAO_TREASURY_CONTRACT}&sender=${donor.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View donation transactions (API data)"
                >
                  {donor.address}
                </a>
              </div>
            </div>
            <div className={styles.stats}>
              <div className={styles.amount}>
                {donor.totalAmount.toFixed(2)} ꜩ
              </div>
              <div className={styles.count}>
                {donor.donationCount} donation
                {donor.donationCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button className={styles.loadMoreButton} onClick={handleLoadMore}>
          Load More
        </button>
      )}
    </div>
  )
}
