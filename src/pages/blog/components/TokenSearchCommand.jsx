import { useState, useCallback, useRef, useEffect } from 'react'
import { commands } from '@uiw/react-md-editor'
import { searchTokensForEmbed } from '@data/api'
import { getTokenPreviewUrl } from '@utils/token'
import { HashToURL } from '@utils'
import styles from './TokenSearchCommand.module.scss'

function TokenSearchDropdown({ close, textApi }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [artistTokens, setArtistTokens] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
      const previewUrl = getTokenPreviewUrl(token)
      const artistName = token.artist_profile?.name || token.artist_address
      const tokenName = token.name || `Token #${token.token_id}`
      const artistAddr = token.artist_address || ''

      const comment = `<!-- teia-token:${JSON.stringify({
        token_id: String(token.token_id),
        artist_address: artistAddr,
        artist_name: artistName,
        mime_type: token.mime_type || '',
        royalties: { decimals: 4, shares: { [artistAddr]: 1500 } },
      })} -->`

      const imageLink = previewUrl
        ? `[![${tokenName} by ${artistName}](${previewUrl})](https://teia.art/objkt/${token.token_id})`
        : `[${tokenName}](https://teia.art/objkt/${token.token_id})`

      const audioLine =
        token.mime_type?.startsWith('audio/') && token.artifact_uri
          ? `\n![Audio](${HashToURL(token.artifact_uri)})`
          : ''

      const attribution = `*[${tokenName}](https://teia.art/objkt/${token.token_id}) by [${artistName}](https://teia.art/${artistAddr})*`

      const markdown = `\n${comment}\n${imageLink}${audioLine}\n${attribution}\n`

      textApi.replaceSelection(markdown)
      close()
    },
    [textApi, close]
  )

  const tokensToShow = artistTokens || results?.tokens || []
  const artists = artistTokens ? [] : results?.artists || []

  return (
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
                      <div className={styles.token_artist}>{artistName}</div>
                    </div>
                    <span className={styles.token_id}>#{token.token_id}</span>
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
  )
}

export const tokenSearchCommand = commands.group([], {
  name: 'teia-token',
  groupName: 'teia-token',
  icon: (
    <svg viewBox="0 0 24 24" width="14" height="14">
      <path
        fill="currentColor"
        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
      />
    </svg>
  ),
  children: (props) => <TokenSearchDropdown {...props} />,
  buttonProps: { 'aria-label': 'Embed Teia Token', title: 'Embed Teia Token' },
})
