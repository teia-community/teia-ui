import React from 'react'
import { useDaoTokenHolders } from '@data/swr'
import { DAO_TOKEN_CONTRACT } from '@constants'
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
  const { holders, error, isLoading, isLoadingMore, isReachingEnd, loadMore } =
    useDaoTokenHolders(limit)

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

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.holdersTable}>
        <div className={styles.tableBody}>
          {holders.map((holder, index) => (
            <div key={holder.address} className={styles.row}>
              {showRank && (
                <div className={styles.rank}>{index + 1}</div>
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
                <div className={styles.balanceAmount}>
                  {formatBalance(holder.balance)} TEIA
                </div>
                <div className={styles.transfers}>
                  <a
                    href={`${import.meta.env.VITE_TZKT_API}/v1/tokens/transfers?anyof.from.to=${holder.address}&token.contract=${DAO_TOKEN_CONTRACT}&token.tokenId=0`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View token transfer transactions (API data)"
                  >
                    {holder.transfersCount} transfer{holder.transfersCount !== 1 ? 's' : ''}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!isReachingEnd && (
        <button
          className={styles.loadMoreButton}
          onClick={loadMore}
          disabled={isLoadingMore}
        >
          Load More
        </button>
      )}
    </div>
  )
}

export default TokenHolders
