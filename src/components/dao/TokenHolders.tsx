import React from 'react'
import { useDaoTokenHolders } from '@data/swr'
import styles from './TokenHolders.module.css'

interface TokenHoldersProps {
  limit?: number
  title?: string
  showRank?: boolean
}

const TokenHolders: React.FC<TokenHoldersProps> = ({
  limit = 10,
  title = 'Top Token Holders',
  showRank = true
}) => {
  const { data: holders, error, isLoading } = useDaoTokenHolders(limit)

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.loading}>Loading token holders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.error}>Failed to load token holders</div>
      </div>
    )
  }

  if (!holders || holders.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.empty}>No token holders found</div>
      </div>
    )
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(balance)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.holdersTable}>
        <div className={styles.tableHeader}>
          {showRank && <div className={styles.rank}>Rank</div>}
          <div className={styles.holder}>Holder</div>
          <div className={styles.balance}>Balance (TEIA)</div>
          <div className={styles.transfers}>Transfers</div>
          <div className={styles.lastActive}>Last Active</div>
        </div>
        <div className={styles.tableBody}>
          {holders.map((holder, index) => (
            <div key={holder.address} className={styles.row}>
              {showRank && (
                <div className={styles.rank}>#{index + 1}</div>
              )}
              <div className={styles.holder}>
                <a
                  href={`https://tzkt.io/${holder.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.holderLink}
                  title={holder.address}
                >
                  {holder.alias || truncateAddress(holder.address)}
                </a>
              </div>
              <div className={styles.balance}>
                {formatBalance(holder.balance)}
              </div>
              <div className={styles.transfers}>
                {holder.transfersCount}
              </div>
              <div className={styles.lastActive}>
                {formatDate(holder.lastTime)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TokenHolders