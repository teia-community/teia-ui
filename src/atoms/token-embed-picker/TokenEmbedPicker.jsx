import { useState, useRef, useEffect, useCallback } from 'react'
import { searchTokensForEmbed } from '@data/api'
import { tokenToEmbed } from '@data/messaging/token-search'
import { HashToURL } from '@utils'
import styles from './index.module.scss'

export default function TokenEmbedPicker({ onSelect, onRemove, hasEmbed }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [artistTokens, setArtistTokens] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  const handleClickOutside = useCallback((e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      inputRef.current?.focus()
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults(null)
      return
    }
    setLoading(true)
    setArtistTokens(null)
    setSelectedArtist(null)
    try {
      const res = await searchTokensForEmbed(q)
      setResults(res)
    } catch (err) {
      console.error('Token search error:', err)
      setResults({ tokens: [], artists: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = useCallback(
    (e) => {
      const value = e.target.value
      setQuery(value)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => doSearch(value), 300)
    },
    [doSearch]
  )

  const handleArtistClick = useCallback(async (artist) => {
    setLoading(true)
    setSelectedArtist(artist)
    try {
      const res = await searchTokensForEmbed(artist.user_address)
      setArtistTokens(res.tokens)
    } catch (err) {
      console.error('Artist tokens error:', err)
      setArtistTokens([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTokenSelect = useCallback(
    (token) => {
      onSelect(tokenToEmbed(token))
      setOpen(false)
      setQuery('')
      setResults(null)
      setArtistTokens(null)
      setSelectedArtist(null)
    },
    [onSelect]
  )

  const handleButtonClick = () => {
    if (hasEmbed) {
      onRemove()
    } else {
      setOpen(!open)
      setQuery('')
      setResults(null)
      setArtistTokens(null)
      setSelectedArtist(null)
    }
  }

  const tokensToShow = artistTokens || results?.tokens || []
  const artists = artistTokens ? [] : results?.artists || []

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        type="button"
        onClick={handleButtonClick}
        title={hasEmbed ? 'Remove embed' : 'Embed token'}
        className={`${styles.trigger} ${hasEmbed ? styles.active : ''}`}
      >
        {hasEmbed ? '🖼️' : '🖼'}
      </button>
      {open && (
        <div className={styles.dropdown}>
          <input
            ref={inputRef}
            className={styles.search_input}
            type="text"
            placeholder="Token ID, artist name, or address..."
            value={query}
            onChange={handleInput}
          />
          <div className={styles.search_hint}>
            Search by token ID, tz address, or name
          </div>

          {loading && <div className={styles.loading}>Searching...</div>}

          {!loading && results && (
            <div className={styles.results}>
              {selectedArtist && (
                <button
                  type="button"
                  className={styles.back_btn}
                  onClick={() => {
                    setArtistTokens(null)
                    setSelectedArtist(null)
                  }}
                >
                  &larr; Back to results
                </button>
              )}

              {selectedArtist && (
                <div className={styles.section_label}>
                  Tokens by {selectedArtist.name}
                </div>
              )}

              {!selectedArtist && artists.length > 0 && (
                <>
                  <div className={styles.section_label}>Artists</div>
                  {artists.map((artist) => (
                    <button
                      type="button"
                      key={artist.user_address}
                      className={styles.artist_item}
                      onClick={() => handleArtistClick(artist)}
                    >
                      <span className={styles.artist_name}>{artist.name}</span>
                      <span className={styles.artist_address}>
                        {artist.user_address.slice(0, 8)}...
                      </span>
                    </button>
                  ))}
                </>
              )}

              {tokensToShow.length > 0 && (
                <>
                  {!selectedArtist && (
                    <div className={styles.section_label}>Tokens</div>
                  )}
                  {tokensToShow.map((token) => {
                    const thumbUrl = token.display_uri
                      ? HashToURL(token.display_uri, 'CDN', { size: 'small' })
                      : ''
                    const artistName =
                      token.artist_profile?.name ||
                      token.artist_address?.slice(0, 8) + '...'
                    return (
                      <button
                        type="button"
                        key={token.token_id}
                        className={styles.token_item}
                        onClick={() => handleTokenSelect(token)}
                      >
                        {thumbUrl && (
                          <img
                            className={styles.token_thumb}
                            src={thumbUrl}
                            alt=""
                            loading="lazy"
                          />
                        )}
                        <div className={styles.token_info}>
                          <div className={styles.token_name}>
                            {token.name || 'Untitled'}
                          </div>
                          <div className={styles.token_artist}>
                            {artistName}
                          </div>
                        </div>
                        <span className={styles.token_id}>
                          #{token.token_id}
                        </span>
                      </button>
                    )
                  })}
                </>
              )}

              {tokensToShow.length === 0 && artists.length === 0 && (
                <div className={styles.empty}>No results found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
