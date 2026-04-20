import { useState, useRef } from 'react'
import { Button } from '@atoms/button'
import { isTzAddress } from '@utils/string'
import { updateChannelAdmins } from '@data/messaging/channel-actions'
import { useClickOutside } from '@hooks/use-click-outside'
import UserSearchDropdown from '@components/dm/UserSearchDropdown'
import styles from './index.module.scss'

export default function AddUserModal({ channelId, onClose }) {
  const [value, setValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef(null)

  const validAddress = isTzAddress(value)

  useClickOutside(contentRef, onClose)

  const handleAdd = async () => {
    if (!validAddress || saving) return
    setSaving(true)
    try {
      await updateChannelAdmins({
        channelId,
        toAdd: [value.trim()],
        toRemove: [],
      })
      onClose()
    } catch (e) {
      console.error('Add user failed:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={contentRef}>
        <h3 style={{ margin: '0 0 12px' }}>Add User</h3>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px' }}>
          Add a wallet address to this channel. They will be added as an admin
          and can post messages.
        </p>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className={styles.formInput}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setShowDropdown(true)
            }}
            placeholder="Enter tz address or name..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
            autoFocus // eslint-disable-line jsx-a11y/no-autofocus
          />
          {showDropdown && !validAddress && (
            <UserSearchDropdown
              query={value}
              onSelect={(user) => {
                setValue(user.user_address)
                setShowDropdown(false)
              }}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button
            shadow_box
            onClick={handleAdd}
            disabled={!validAddress || saving}
          >
            {saving ? 'Adding...' : 'Add User'}
          </Button>
          <Button shadow_box onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
