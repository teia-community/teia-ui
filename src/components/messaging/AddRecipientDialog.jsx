/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useState, useEffect, useCallback, useRef } from 'react'
import { validateAddress } from '@taquito/utils'
import { searchUsersByName } from '@data/api'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { Button } from '@atoms/button'
import styles from '@style'

const isAddressLike = (v) => v.startsWith('tz') || v.startsWith('KT')

export const AddRecipientDialog = ({
  existingParticipants,
  onAdd,
  onClose,
}) => {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const timerRef = useRef(null)

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Name search with debounce
  useEffect(() => {
    clearTimeout(timerRef.current)

    if (!address || address.length < 2 || isAddressLike(address)) {
      setResults([])
      setShowDropdown(false)
      return
    }

    timerRef.current = setTimeout(async () => {
      const users = await searchUsersByName(address)
      setResults(users)
      setShowDropdown(users.length > 0)
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [address])

  const handleSelect = (user) => {
    setAddress(user.user_address)
    setResults([])
    setShowDropdown(false)
  }

  const handleAdd = () => {
    const trimmed = address.trim()

    if (validateAddress(trimmed) !== 3) {
      setError('Invalid Tezos address')
      return
    }
    if (existingParticipants?.includes(trimmed)) {
      setError('Already a participant')
      return
    }

    onAdd(trimmed)
    setAddress('')
    setError('')
    onClose()
  }

  return (
    <div
      className={styles.dialog_backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Add Recipient"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.dialog}
        role="document"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={styles.dialog_header}>
          <h3>Add Recipient</h3>
          <button className={styles.dialog_close} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.recipient_container}>
          <div className={styles.dialog_input_row}>
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setError('')
              }}
              placeholder="tz1... or search by name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
            />
            <Button small onClick={handleAdd}>
              Add
            </Button>
          </div>
          {error && <p className={styles.dialog_error}>{error}</p>}

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
                  <span className={styles.recipient_option_name}>
                    {user.name}
                  </span>
                  <span className={styles.recipient_option_addr}>
                    {walletPreview(user.user_address)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
