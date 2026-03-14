import { useState, useEffect, useRef, useCallback } from 'react'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { searchUsersByName } from '@data/api'
import styles from './MentionDropdown.module.scss'

export default function MentionDropdown({ query, onSelect, onClose }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    let cancelled = false
    setLoading(true)

    searchUsersByName(query).then((users) => {
      if (!cancelled) {
        setResults(users.slice(0, 8))
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [query])

  const handleClickOutside = useCallback(
    (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  if (!query || query.length < 2) return null
  if (!loading && results.length === 0) return null

  return (
    <div ref={containerRef} className={styles.dropdown}>
      {loading && <div className={styles.loading}>Searching...</div>}
      {results.map((user) => (
        <button
          key={user.user_address}
          className={styles.option}
          onClick={() => onSelect(user.user_address)}
        >
          <Identicon
            address={user.user_address}
            logo={user.metadata?.data?.identicon || user.metadata?.data?.logo}
            className={styles.optionAvatar}
          />
          <span className={styles.optionName}>{user.name}</span>
          <span className={styles.optionAddr}>
            {walletPreview(user.user_address)}
          </span>
        </button>
      ))}
    </div>
  )
}
