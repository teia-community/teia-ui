import { useMemo, useState } from 'react'
import { useFountainDonations } from '@data/swr'
import { TEIA_FOUNTAIN_CONTRACT, DONATION_EXCLUDED_ADDRESSES } from '@constants'
import styles from './TopDonors.module.scss'

export function FountainDonors({
  limit: initialLimit = 10,
  excludeAddresses = DONATION_EXCLUDED_ADDRESSES,
}) {
  const [displayLimit, setDisplayLimit] = useState(initialLimit)
  const {
    data: transactions,
    isLoading,
    error,
  } = useFountainDonations(TEIA_FOUNTAIN_CONTRACT)

  const allDonors = useMemo(() => {
    if (!transactions) return []

    // Aggregate donations by sender address
    const donorMap = {}
    const excludeSet = new Set(excludeAddresses)

    transactions.forEach((tx) => {
      const address = tx.sender?.address
      const alias = tx.sender?.alias
      const amount = parseInt(tx.amount) || 0

      // Skip excluded addresses: all KT1 contracts + specific tz addresses
      if (address && !address.startsWith('KT1') && !excludeSet.has(address)) {
        if (!donorMap[address]) {
          donorMap[address] = {
            address,
            alias,
            totalAmount: 0,
            donationCount: 0,
            firstDonation: tx.timestamp,
            lastDonation: tx.timestamp,
          }
        }

        donorMap[address].totalAmount += amount
        donorMap[address].donationCount += 1

        // Update first/last donation timestamps
        if (
          new Date(tx.timestamp) < new Date(donorMap[address].firstDonation)
        ) {
          donorMap[address].firstDonation = tx.timestamp
        }
        if (new Date(tx.timestamp) > new Date(donorMap[address].lastDonation)) {
          donorMap[address].lastDonation = tx.timestamp
        }
      }
    })

    // Convert to array and sort by total amount (descending)
    return Object.values(donorMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((donor) => ({
        ...donor,
        totalAmount: donor.totalAmount / 1000000, // Convert from mutez to tez
      }))
  }, [transactions, excludeAddresses])

  const topDonors = useMemo(() => {
    return allDonors.slice(0, displayLimit)
  }, [allDonors, displayLimit])

  if (isLoading) {
    return <div className={styles.loading}>Loading donations...</div>
  }

  if (error) {
    return <div className={styles.error}>Error loading donations</div>
  }

  if (!topDonors || topDonors.length === 0) {
    return <div className={styles.empty}>No donations found</div>
  }

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + initialLimit)
  }

  const hasMore = allDonors.length > displayLimit

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Top Fountain Donors</h3>
      <div className={styles.list}>
        {topDonors.map((donor, index) => (
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
                  href={`${
                    import.meta.env.VITE_TZKT_API
                  }/v1/operations/transactions?target=${TEIA_FOUNTAIN_CONTRACT}&sender=${
                    donor.address
                  }`}
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
        <button
          className={styles.loadMoreButton}
          onClick={handleLoadMore}
          disabled={isLoading}
        >
          Load More
        </button>
      )}
    </div>
  )
}
