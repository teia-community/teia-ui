/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useState, useEffect, useCallback } from 'react'
import { validateAddress } from '@taquito/utils'
import { Button } from '@atoms/button'
import styles from '@style'

export const AddRecipientDialog = ({
  existingParticipants,
  onAdd,
  onClose,
}) => {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

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

        <div className={styles.dialog_input_row}>
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setError('')
            }}
            placeholder="tz1... or KT1..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          <Button small onClick={handleAdd}>
            Add
          </Button>
        </div>
        {error && <p className={styles.dialog_error}>{error}</p>}
      </div>
    </div>
  )
}
