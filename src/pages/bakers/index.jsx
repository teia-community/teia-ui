import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import Identicon from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { useBakers, useBakersCount } from '@data/swr'
import styles from './Bakers.module.scss'

const PAGE_SIZE = 25

const fmtXTZ = (mutez) =>
  typeof mutez === 'number'
    ? `${Math.round(mutez / 1000000).toLocaleString()} ꜩ`
    : '—'

export default function BakersPage() {
  const [page, setPage] = useState(0)
  const [bakers] = useBakers(PAGE_SIZE, page * PAGE_SIZE)
  const [total] = useBakersCount()

  const hasMore = total
    ? (page + 1) * PAGE_SIZE < total
    : bakers?.length === PAGE_SIZE

  return (
    <Page>
      <Container>
        <div className={styles.page}>
          <h1 className={styles.heading}>Bakers{total ? ` (${total})` : ''}</h1>
          <p className={styles.subheading}>
            Active bakers, sorted by staking power.
          </p>

          {!bakers ? (
            <Loading message="Loading bakers..." />
          ) : (
            <ul className={styles.list}>
              {bakers.map((b) => (
                <li key={b.address} className={styles.row}>
                  <Link to={`/baker/${b.address}`} className={styles.baker}>
                    <Identicon
                      address={b.address}
                      logo={`https://services.tzkt.io/v1/avatars/${b.address}`}
                      className={styles.avatar}
                    />
                    <span className={styles.name}>
                      {b.alias || walletPreview(b.address)}
                    </span>
                  </Link>
                  <div className={styles.metrics}>
                    <span className={styles.metric}>
                      <span className={styles.metricLabel}>Staking</span>
                      {fmtXTZ(b.stakingBalance)}
                    </span>
                    <span className={styles.metric}>
                      <span className={styles.metricLabel}>Delegators</span>
                      {b.numDelegators ?? '—'}
                    </span>
                  </div>
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

          <p className={styles.note}>Data from TzKT.</p>
        </div>
      </Container>
    </Page>
  )
}
