import { useState, useEffect, useCallback } from 'react'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import Button from '@atoms/button/Button'
import {
  fetchCopyrightsPaginated,
  fetchCopyrightsCount,
  fetchCreatorAliases,
} from '@data/swr'
import CopyrightFilters, {
  type FilterValues,
} from '@components/copyright/marketplace/CopyrightFilters'
import CopyrightListItem from '@components/copyright/marketplace/CopyrightListItem'
import type { CopyrightEntry } from '@components/copyright/shared/CopyrightTypes'
import styles from '@style'

const PAGE_SIZE = 20

const INITIAL_FILTERS: FilterValues = {
  publicDisplay: 'all',
  reproduce: 'all',
  broadcast: 'all',
  createDerivativeWorks: 'all',
  requireAttribution: 'all',
  rightsAreTransferable: 'all',
  expirationDate: 'all',
  exclusiveRights: 'all',
  releasePublicDomain: 'all',
}

function getActiveFilters(filters: FilterValues) {
  const active: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== 'all') active[key] = value
  }
  return active
}

export default function CopyrightMarketplace() {
  const [entries, setEntries] = useState<CopyrightEntry[]>([])
  const [aliases, setAliases] = useState<Map<string, string>>(new Map())
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS)

  const loadData = useCallback(
    async (currentOffset: number, append: boolean) => {
      const activeFilters = getActiveFilters(filters)
      const data: CopyrightEntry[] = await fetchCopyrightsPaginated({
        offset: currentOffset,
        limit: PAGE_SIZE,
        filters: activeFilters,
      })

      // Batch fetch creator aliases
      const allAddresses = new Set<string>()
      data.forEach((entry) =>
        entry.value.creators?.forEach((addr) => allAddresses.add(addr))
      )
      const newAliases = await fetchCreatorAliases(Array.from(allAddresses))

      if (append) {
        setEntries((prev) => [...prev, ...data])
        setAliases((prev) => {
          const merged = new Map(prev)
          newAliases.forEach((v: string, k: string) => merged.set(k, v))
          return merged
        })
      } else {
        setEntries(data)
        setAliases(newAliases)
      }

      return data.length
    },
    [filters]
  )

  // Initial load + filter changes
  useEffect(() => {
    setLoading(true)
    setOffset(0)

    const activeFilters = getActiveFilters(filters)
    Promise.all([
      loadData(0, false),
      fetchCopyrightsCount(activeFilters),
    ]).then(([, count]) => {
      setTotalCount(count)
      setLoading(false)
    })
  }, [filters, loadData])

  const handleLoadMore = async () => {
    const nextOffset = offset + PAGE_SIZE
    setLoadingMore(true)
    await loadData(nextOffset, true)
    setOffset(nextOffset)
    setLoadingMore(false)
  }

  const hasMore = entries.length < totalCount

  return (
    <Page title="Copyright Registry">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Copyright Registry</h1>
          <p className={styles.description}>
            Browse copyright registrations on the Teia Copyright smart contract.
            Artists can register their works, define licensing clauses, and
            establish on-chain proof of authorship.
          </p>
          <div className={styles.headerActions}>
            <Button to="/copyright" shadow_box>
              Register Your Work
            </Button>
            <span className={styles.stats}>
              {totalCount} copyright{totalCount !== 1 ? 's' : ''} registered
              {Object.values(filters).some((v) => v !== 'all') &&
                ` (${entries.length} shown)`}
            </span>
          </div>
        </div>

        <CopyrightFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <Loading message="Loading copyrights..." />
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            No copyrights match the current filters.
          </div>
        ) : (
          <div className={styles.results}>
            {entries.map((entry) => (
              <CopyrightListItem
                key={entry.id}
                entry={entry}
                aliases={aliases}
              />
            ))}
            {hasMore && (
              <div className={styles.loadMoreContainer}>
                {loadingMore ? (
                  <Loading message="Loading more..." />
                ) : (
                  <Button onClick={handleLoadMore} shadow_box>
                    Load More
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  )
}
