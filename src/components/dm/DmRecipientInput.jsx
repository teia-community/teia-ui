import { useState, useEffect, useRef } from 'react'
import { validateAddress } from '@taquito/utils'
import { getUser, searchUsersByName } from '@data/api'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import styles from '@style'

const isAddressLike = (v) => v.startsWith('tz') || v.startsWith('KT')

export default function DmRecipientInput({
  value,
  onChange,
  onRemove,
  showRemove,
}) {
  const [error, setError] = useState('')
  const [resolved, setResolved] = useState('')
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  // Address validation + alias resolution
  // to be changed to use common validation
  useEffect(() => {
    setResolved('')
    setError('')

    if (!value || value.length < 36) return

    if (validateAddress(value) !== 3) {
      setError('Invalid address')
      return
    }

    let cancelled = false
    getUser(value).then((user) => {
      if (!cancelled && user?.name) {
        setResolved(user.name)
      }
    })
    return () => {
      cancelled = true
    }
  }, [value])

  // Name search with debounce
  useEffect(() => {
    clearTimeout(timerRef.current)

    if (!value || value.length < 2 || isAddressLike(value)) {
      setResults([])
      setShowDropdown(false)
      return
    }

    timerRef.current = setTimeout(async () => {
      const users = await searchUsersByName(value)
      setResults(users)
      setShowDropdown(users.length > 0)
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (user) => {
    onChange(user.user_address)
    setResults([])
    setShowDropdown(false)
  }

  return (
    <div ref={containerRef} className={styles.recipient_container}>
      <div className={styles.recipient_row}>
        <input
          className={styles.recipient_input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="tz1... or search by name"
        />
        {resolved && (
          <span className={styles.recipient_resolved}>{resolved}</span>
        )}
        {showRemove && (
          <button className={styles.recipient_remove} onClick={onRemove}>
            &times;
          </button>
        )}
      </div>
      {error && <p className={styles.recipient_error}>{error}</p>}

      {showDropdown && (
        <div className={styles.recipient_dropdown}>
          {results.map((user) => (
            <button
              key={user.user_address}
              className={styles.recipient_option}
              onClick={() => handleSelect(user)}
            >
              <Identicon
                address={user.user_address}
                logo={user.metadata?.data?.identicon}
                className={styles.recipient_option_avatar}
              />
              <span className={styles.recipient_option_name}>{user.name}</span>
              <span className={styles.recipient_option_addr}>
                {walletPreview(user.user_address)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
