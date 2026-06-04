import { useState } from 'react'
import { Link } from 'react-router-dom'
import Identicon from '@atoms/identicons'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { walletPreview } from '@utils/string'
import { useBakerDelegators } from '@data/swr'
import styles from './BakerDelegators.module.scss'

const PAGE_SIZE = 25

const fmtXTZ = (mutez) =>
  typeof mutez === 'number'
    ? `${Math.round(mutez / 1000000).toLocaleString()} ꜩ`
    : '—'

/**
 * Paginated list of accounts delegating to a baker.
 */
export default function BakerDelegators({ address, total }) {
  const [page, setPage] = useState(0)
  const [delegators] = useBakerDelegators(address, PAGE_SIZE, page * PAGE_SIZE)

  const hasMore =
    typeof total === 'number'
      ? (page + 1) * PAGE_SIZE < total
      : delegators?.length === PAGE_SIZE

  return (
    <div className={styles.delegators}>
      <h3 className={styles.title}>
        Delegators{typeof total === 'number' ? ` (${total})` : ''}
      </h3>

      {!delegators ? (
        <Loading message="Loading delegators..." />
      ) : delegators.length === 0 ? (
        <p className={styles.empty}>No delegators.</p>
      ) : (
        <ul className={styles.list}>
          {delegators.map((d) => (
            <li key={d.address} className={styles.row}>
              <Link to={`/tz/${d.address}`} className={styles.delegator}>
                <Identicon address={d.address} className={styles.dAvatar} />
                <span className={styles.dName}>
                  {d.alias || walletPreview(d.address)}
                </span>
              </Link>
              <span className={styles.dBalance}>{fmtXTZ(d.balance)}</span>
            </li>
          ))}
        </ul>
      )}

      {(page > 0 || hasMore) && (
        <div className={styles.pager}>
          <Button
            small
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className={styles.pageInfo}>Page {page + 1}</span>
          <Button
            small
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
