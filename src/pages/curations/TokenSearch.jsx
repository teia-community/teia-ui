import { useState, useRef, useCallback } from 'react'
import { Input } from '@atoms/input'
import Button from '@atoms/button/Button'
import { searchTokensAndArtists, searchTokens } from '@data/curations'
import PickerGrid from './PickerGrid'
import styles from '@style'

const PAGE_SIZE = 48

// WORK IN PROGRESS
// Testing different search types

export default function TokenSearch({ selectedKeys, onToggle }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [artistTokens, setArtistTokens] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    setLoading(true)
    setArtistTokens(null)
    setSelectedArtist(null)
    setVisible(PAGE_SIZE)
    try {
      setResults(await searchTokensAndArtists(q))
    } catch (err) {
      console.warn('Token search error:', err)
      setResults({ tokens: [], artists: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  const onChange = (value) => {
    const v = typeof value === 'string' ? value : value?.target?.value || ''
    setQuery(v)
    clearTimeout(debounceRef.current)
    const q = v.trim()
    debounceRef.current = setTimeout(() => {
      if (q) doSearch(q)
      else {
        setResults(null)
        setArtistTokens(null)
        setSelectedArtist(null)
      }
    }, 350)
  }

  const onArtistClick = useCallback(async (artist) => {
    setLoading(true)
    setSelectedArtist(artist)
    setVisible(PAGE_SIZE)
    try {
      setArtistTokens(await searchTokens(artist.user_address))
    } catch (err) {
      console.warn('Artist tokens error:', err)
      setArtistTokens([])
    } finally {
      setLoading(false)
    }
  }, [])

  const backToResults = () => {
    setArtistTokens(null)
    setSelectedArtist(null)
    setVisible(PAGE_SIZE)
  }

  const tokensToShow = artistTokens ?? results?.tokens ?? []
  const artists = artistTokens ? [] : results?.artists ?? []

  return (
    <div>
      <Input
        type="text"
        placeholder="token id, teia.art URL, artist name, or tz/KT address"
        value={query}
        onChange={onChange}
      />

      {loading && <p className={styles.empty}>Searching…</p>}

      {!loading && results && (
        <>
          {selectedArtist && (
            <Button small onClick={backToResults}>
              ← Back to results
            </Button>
          )}
          {selectedArtist && (
            <div className={styles.section_label}>
              Tokens by {selectedArtist.name}
            </div>
          )}

          {!selectedArtist && artists.length > 0 && (
            <>
              <div className={styles.section_label}>Artists</div>
              <div className={styles.artist_list}>
                {artists.map((artist) => (
                  <button
                    type="button"
                    key={artist.user_address}
                    className={styles.artist_item}
                    onClick={() => onArtistClick(artist)}
                  >
                    <span className={styles.artist_name}>{artist.name}</span>
                    <span className={styles.artist_address}>
                      {artist.user_address.slice(0, 8)}…
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {!selectedArtist && tokensToShow.length > 0 && (
            <div className={styles.section_label}>Tokens</div>
          )}

          {tokensToShow.length > 0 && (
            <>
              <PickerGrid
                tokens={tokensToShow.slice(0, visible)}
                selectedKeys={selectedKeys}
                onToggle={onToggle}
              />
              {tokensToShow.length > visible && (
                <Button small onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Load more ({tokensToShow.length - visible})
                </Button>
              )}
            </>
          )}

          {tokensToShow.length === 0 && artists.length === 0 && (
            <p className={styles.empty}>No results found.</p>
          )}
        </>
      )}
    </div>
  )
}
