import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { useClickOutside } from '@hooks/use-click-outside'
import { createDmChannel } from '@data/messaging/channel-actions'
import { isTzAddress, walletPreview } from '@utils/string'
import UserSearchDropdown from '@components/shared/UserSearchDropdown'
import styles from './index.module.scss'

export default function CreateDmModal({ isOpen, onClose, inbox }) {
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)
  const contentRef = useRef(null)

  const [query, setQuery] = useState('')
  const [recipient, setRecipient] = useState(null)
  const [recipientName, setRecipientName] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useClickOutside(contentRef, () => {
    if (isOpen && !submitting) onClose()
  })

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setRecipient(null)
      setRecipientName('')
      setShowDropdown(false)
      setName('')
      setDescription('')
      setSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, submitting, onClose])

  const selectRecipient = (userAddress, alias) => {
    setRecipient(userAddress)
    setRecipientName(alias || walletPreview(userAddress))
    setQuery(alias || walletPreview(userAddress))
    setShowDropdown(false)
    if (!name) setName(`DM with ${alias || walletPreview(userAddress)}`)
  }

  const handleSubmit = async () => {
    if (submitting || !address || !recipient) return

    const existingDm = (inbox ?? []).find(
      (c) =>
        c.metadata.kind === 'dm' &&
        (c.metadata.participants ?? []).includes(recipient)
    )
    if (existingDm) {
      onClose()
      navigate(`/inbox/channels/${existingDm.id}`)
      return
    }

    setSubmitting(true)
    try {
      const { channelId } = await createDmChannel({
        recipient,
        creator: address,
        name: name.trim() || `DM with ${recipientName}`,
        description: description.trim(),
      })
      onClose()
      navigate(
        channelId ? `/inbox/channels/${channelId}` : `/inbox/dm/${recipient}`
      )
    } catch (err) {
      console.warn('Create DM failed:', err)
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.wizardModal} ref={contentRef}>
        <h2 className={styles.wizardTitle}>Start Direct Message</h2>

        <div className={styles.wizardBody}>
          <label className={styles.formLabel}>
            Recipient
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className={styles.formInput}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowDropdown(true)
                  if (recipient && e.target.value !== query) {
                    setRecipient(null)
                    setRecipientName('')
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    isTzAddress(query.trim()) &&
                    !recipient
                  ) {
                    selectRecipient(query.trim(), '')
                  }
                }}
                placeholder="Enter tz address or name..."
              />
              {showDropdown &&
                query.length >= 2 &&
                !recipient &&
                !isTzAddress(query) && (
                  <UserSearchDropdown
                    query={query}
                    onSelect={(user) =>
                      selectRecipient(user.user_address, user.name)
                    }
                    onClose={() => setShowDropdown(false)}
                  />
                )}
            </div>
          </label>

          <label className={styles.formLabel}>
            Name
            <input
              type="text"
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DM name (visible to both)"
            />
          </label>

          <label className={styles.formLabel}>
            Description (optional)
            <textarea
              className={styles.formTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note about this DM"
              rows={2}
            />
          </label>
        </div>

        <div className={styles.wizardFooter}>
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button shadow_box onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              shadow_box
              onClick={handleSubmit}
              disabled={submitting || !recipient}
            >
              {submitting ? 'Starting...' : 'Start DM'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
