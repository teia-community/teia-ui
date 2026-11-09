import { useState, useEffect } from 'react'
import { Page, Container } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Input } from '@atoms/input'
import { Loading } from '@atoms/loading'
import { PATH } from '@constants'
import {
  useCurationsInfinite,
  useCurationSearch,
  useCurationRoles,
} from '@data/curations'
import { useUserStore } from '@context/userStore'
import CurationGrid from './CurationGrid'
import MigrationNotice from './MigrationNotice'
import styles from '@style'

export default function CurationsHome() {
  const [order, setOrder] = useState('desc')
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const searching = debounced.length > 0
  const browse = useCurationsInfinite(order)
  const search = useCurationSearch(debounced, order)

  const address = useUserStore((st) => st.address)
  const { data: roles } = useCurationRoles(address)

  return (
    <Page
      title="Curations"
      description="Curations on Teia: on-chain collections of artworks put together by members of the community."
    >
      <Container>
        <div className={styles.header}>
          <h1>Curations</h1>
          {roles?.canCreate && (
            <Button shadow_box to={`${PATH.CURATIONS}/create`}>
              New curation
            </Button>
          )}
        </div>

        <MigrationNotice address={address} />

        <div className={styles.toolbar}>
          <Input
            type="text"
            placeholder="Search title, tag, artist…"
            value={query}
            onChange={(v) =>
              setQuery(typeof v === 'string' ? v : v?.target?.value || '')
            }
          />
          <div className={styles.seg} role="group" aria-label="Sort order">
            <button
              type="button"
              className={`${styles.seg_btn} ${
                order === 'desc' ? styles.seg_btn_active : ''
              }`}
              aria-pressed={order === 'desc'}
              onClick={() => setOrder('desc')}
            >
              Latest
            </button>
            <button
              type="button"
              className={`${styles.seg_btn} ${
                order === 'asc' ? styles.seg_btn_active : ''
              }`}
              aria-pressed={order === 'asc'}
              onClick={() => setOrder('asc')}
            >
              Oldest
            </button>
          </div>
        </div>

        {searching ? (
          search.error ? (
            <p className={styles.empty}>Could not search curations.</p>
          ) : search.isLoading ? (
            <Loading
              message={`Searching… (${search.progress.loaded}/${search.progress.total})`}
            />
          ) : (
            <CurationGrid
              curations={search.results}
              emptyMessage={`No curations match “${debounced}”.`}
            />
          )
        ) : (
          <>
            {browse.error && (
              <p className={styles.empty}>Could not load curations.</p>
            )}
            {browse.isLoadingInitial && !browse.error && (
              <Loading message="Loading curations" />
            )}
            {!browse.isLoadingInitial && !browse.error && (
              <>
                <CurationGrid
                  curations={browse.curations}
                  emptyMessage="No curations yet."
                />
                {browse.curations.length > 0 && !browse.reachedEnd && (
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Button
                      shadow_box
                      onClick={browse.loadMore}
                      disabled={browse.isLoadingMore}
                    >
                      {browse.isLoadingMore ? 'Loading…' : 'Load more'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </Page>
  )
}
