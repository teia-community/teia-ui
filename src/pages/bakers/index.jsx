import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Checkbox, Input } from '@atoms/input'
import Identicon from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { useBakerRegistry, useAllDelegates, useUsers } from '@data/swr'
import { TZKT_AVATARS_URL } from '@constants'
import styles from './Bakers.module.scss'

const PAGE_SIZE = 25

const tzktAvatar = (address) => `${TZKT_AVATARS_URL}/${address}`

const pct = (v) => (typeof v === 'number' ? `${+(v * 100).toFixed(2)}%` : '—')
const xtz = (v) =>
  typeof v === 'number' ? `${Math.round(v).toLocaleString()} ꜩ` : '—'
const powerXtz = (mutez) =>
  typeof mutez === 'number'
    ? `${Math.round(mutez / 1000000).toLocaleString()} ꜩ`
    : '—'

// Each sortable column: row field used for sorting + how to render the cell.
const COLUMNS = [
  {
    key: 'power',
    field: 'bakingPower',
    label: 'Power',
    cls: styles.hideSmall,
    render: (r) => powerXtz(r.bakingPower),
  },
  { key: 'fee', field: 'fee', label: 'Fee', render: (r) => pct(r.fee) },
  { key: 'apy', field: 'apy', label: 'Est. APY', render: (r) => pct(r.apy) },
  {
    key: 'freeSpace',
    field: 'freeSpace',
    label: 'Free space',
    cls: styles.hideSmall,
    render: (r) => xtz(r.freeSpace),
  },
  {
    key: 'delegators',
    field: 'numDelegators',
    label: 'Delegators',
    cls: styles.hideSmall,
    render: (r) => r.numDelegators ?? '—',
  },
]

export default function BakersPage() {
  const [registry, registryError] = useBakerRegistry()
  const [delegates] = useAllDelegates()

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('power')
  const [sortDir, setSortDir] = useState('desc')
  const [openOnly, setOpenOnly] = useState(false)
  const [hasFreeSpace, setHasFreeSpace] = useState(false)
  const [page, setPage] = useState(0)

  // Index the on-chain data by address for O(1) enrichment.
  const tzktMap = useMemo(() => {
    const map = {}
    for (const b of delegates ?? []) map[b.address] = b
    return map
  }, [delegates])

  // Registry defines the rows; TzKT fills in power/delegators.
  const rows = useMemo(() => {
    if (!registry) return undefined
    return registry.map((r) => ({
      address: r.address,
      name: r.name,
      fee: r.delegation?.fee,
      apy: r.delegation?.estimatedApy,
      freeSpace: r.delegation?.freeSpace,
      open: r.delegation?.enabled,
      bakingPower: tzktMap[r.address]?.bakingPower,
      numDelegators: tzktMap[r.address]?.numDelegators,
    }))
  }, [registry, tzktMap])

  const derived = useMemo(() => {
    if (!rows) return undefined
    const q = search.trim().toLowerCase()
    const field = COLUMNS.find((c) => c.key === sortKey)?.field
    const dir = sortDir === 'asc' ? 1 : -1

    return rows
      .filter((r) => {
        if (openOnly && r.open !== true) return false
        if (hasFreeSpace && !(r.freeSpace > 0)) return false
        if (q) {
          return (
            r.name?.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        const av = a[field]
        const bv = b[field]
        const an = typeof av === 'number'
        const bn = typeof bv === 'number'
        if (!an && !bn) return 0
        if (!an) return 1 // missing values always last
        if (!bn) return -1
        return (av - bv) * dir
      })
  }, [rows, search, sortKey, sortDir, openOnly, hasFreeSpace])

  // Reset to the first page whenever the result set or order changes.
  useEffect(
    () => setPage(0),
    [search, sortKey, sortDir, openOnly, hasFreeSpace]
  )

  const visible = useMemo(
    () =>
      derived ? derived.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : [],
    [derived, page]
  )
  const [profiles] = useUsers(visible.map((r) => r.address))

  const hasMore = derived ? (page + 1) * PAGE_SIZE < derived.length : false

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <Page>
      <Container>
        <div className={styles.page}>
          <h1 className={styles.heading}>
            Bakers{derived ? ` (${derived.length})` : ''}
          </h1>
          <p className={styles.subheading}>
            Registered bakers with fee &amp; estimated yield from Baking Bad.
            Click a column to sort.
          </p>

          <div className={styles.controls}>
            <Input
              name="baker-search"
              value={search}
              onChange={setSearch}
              placeholder="Search by name or address"
              label="Search"
            />
            <Checkbox
              checked={openOnly}
              onCheck={setOpenOnly}
              label="Open for delegation"
            />
            <Checkbox
              checked={hasFreeSpace}
              onCheck={setHasFreeSpace}
              label="Has free space"
            />
          </div>

          {registryError ? (
            <p className={styles.empty}>Could not load the bakers registry.</p>
          ) : !derived ? (
            <Loading message="Loading bakers..." />
          ) : derived.length === 0 ? (
            <p className={styles.empty}>No bakers match your filters.</p>
          ) : (
            <div className={styles.table}>
              <div className={styles.headRow}>
                <span className={styles.thName}>Baker</span>
                {COLUMNS.map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    className={`${styles.th} ${col.cls || ''} ${
                      sortKey === col.key ? styles.thActive : ''
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className={styles.arrow}>
                        {sortDir === 'desc' ? '▼' : '▲'}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {visible.map((r) => {
                const profile = profiles[r.address]
                return (
                  <Link
                    to={`/baker/${r.address}`}
                    key={r.address}
                    className={styles.row}
                  >
                    <span className={styles.baker}>
                      <Identicon
                        address={r.address}
                        logo={profile?.logo || tzktAvatar(r.address)}
                        className={styles.avatar}
                      />
                      <span className={styles.name}>
                        {r.name || profile?.alias || walletPreview(r.address)}
                      </span>
                    </span>
                    {COLUMNS.map((col) => (
                      <span
                        key={col.key}
                        className={`${styles.cell} ${col.cls || ''}`}
                      >
                        {col.render(r)}
                      </span>
                    ))}
                  </Link>
                )
              })}
            </div>
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

          <p className={styles.note}>Data from TzKT &amp; Baking Bad.</p>
        </div>
      </Container>
    </Page>
  )
}
