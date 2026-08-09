import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@atoms/input'
import Button from '@atoms/button/Button'
import {
  fetchCollected,
  fetchCreated,
  searchCollected,
  searchCreated,
} from '@data/curations'
import { useUserStore } from '@context/userStore'
import PickerGrid from './PickerGrid'
import TokenSearch from './TokenSearch'
import styles from '@style'

const TABS = [
  { id: 'created', label: 'My creations' },
  { id: 'collected', label: 'My collection' },
  { id: 'search', label: 'Search' },
]

const PAGE_SIZE = 48

export default function TokenPicker({ selectedKeys, onToggle }) {
  const address = useUserStore((st) => st.address)
  const [tab, setTab] = useState('created')
  const [tokens, setTokens] = useState([])
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => setVisible(PAGE_SIZE), [tokens])

  const seqRef = useRef(0)
  const run = useCallback(async (loader) => {
    const seq = ++seqRef.current
    setLoading(true)
    try {
      const result = await loader()
      if (seq !== seqRef.current) return
      setTokens(result)
    } catch (err) {
      if (seq !== seqRef.current) return
      console.warn('Token picker error:', err)
      setTokens([])
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'created' && address) run(() => fetchCreated(address))
    else if (tab === 'collected' && address) run(() => fetchCollected(address))
    else {
      seqRef.current++
      setTokens([])
      setLoading(false)
    }
  }, [tab, address, run])

  const isAutoTab = tab === 'created' || tab === 'collected'

  const onFilterChange = (value) => {
    const v = typeof value === 'string' ? value : value?.target?.value || ''
    setFilter(v)
    setVisible(PAGE_SIZE)
    clearTimeout(debounceRef.current)
    const query = v.trim()
    debounceRef.current = setTimeout(() => {
      if (!address) return
      if (!query) {
        run(() =>
          tab === 'collected' ? fetchCollected(address) : fetchCreated(address)
        )
      } else {
        run(() =>
          tab === 'collected'
            ? searchCollected(address, query)
            : searchCreated(address, query)
        )
      }
    }, 350)
  }

  return (
    <div>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tab_active : ''}`}
            onClick={() => {
              clearTimeout(debounceRef.current)
              setTab(t.id)
              setFilter('')
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'search' ? (
        <TokenSearch selectedKeys={selectedKeys} onToggle={onToggle} />
      ) : (
        <>
          {!address && (
            <p className={styles.empty}>Sync your wallet to see your tokens.</p>
          )}

          {address && (
            <Input
              type="text"
              placeholder={
                tab === 'collected'
                  ? 'Filter your collection by title or artist'
                  : 'Filter your creations'
              }
              value={filter}
              onChange={onFilterChange}
            />
          )}

          {loading ? (
            <p className={styles.empty}>Loading tokens…</p>
          ) : (
            <>
              <PickerGrid
                tokens={tokens.slice(0, visible)}
                selectedKeys={selectedKeys}
                onToggle={onToggle}
              />
              {tokens.length > visible && (
                <Button small onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Load more ({tokens.length - visible})
                </Button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
