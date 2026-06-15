import { useState, useRef } from 'react'
import { Button } from '@atoms/button'
import { isTzAddress } from '@utils/string'
import {
  updateChannelAdmins,
  addMerkleUsers,
} from '@data/messaging/channel-actions'
import { useClickOutside } from '@hooks/use-click-outside'
import UserSearchDropdown from '@components/shared/UserSearchDropdown'
import styles from './index.module.scss'

export default function AddUserModal({
  channelId,
  currentMerkleList = [],
  canAddAdmin = false,
  accessMode,
  onClose,
  onAdded,
}) {
  const isClosed = accessMode === 'closed'
  const [value, setValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState(isClosed || canAddAdmin ? 'admin' : 'user')
  const contentRef = useRef(null)

  const validAddress = isTzAddress(value)

  useClickOutside(contentRef, onClose)

  const handleAdd = async () => {
    if (!validAddress || saving) return
    setSaving(true)
    try {
      if (role === 'admin') {
        await updateChannelAdmins({
          channelId,
          toAdd: [value.trim()],
          toRemove: [],
        })
      } else {
        await addMerkleUsers({
          channelId,
          currentList: currentMerkleList,
          addresses: [value.trim()],
        })
      }
      if (onAdded) onAdded()
      onClose()
    } catch (e) {
      console.warn('Add user failed:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={contentRef}>
        <h3 style={{ margin: '0 0 12px' }}>Add user</h3>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px' }}>
          {role === 'admin'
            ? 'Admins can post freely, configure the channel, and update its metadata. Only the creator can add or remove admins.'
            : 'Users can post in the channel via Merkle allowlist proofs. Both creator and admins can add users.'}
        </p>

        {!isClosed && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <Button
              shadow_box
              selected={role === 'admin'}
              onClick={() => setRole('admin')}
              disabled={!canAddAdmin}
              title={
                canAddAdmin
                  ? 'Add as channel admin'
                  : 'Only the channel creator can add admins'
              }
            >
              Admin
            </Button>
            <Button
              shadow_box
              selected={role === 'user'}
              onClick={() => setRole('user')}
            >
              User
            </Button>
          </div>
        )}
        {isClosed && canAddAdmin && (
          <p style={{ fontSize: 12, opacity: 0.6, margin: '0 0 12px' }}>
            This is a closed channel — only admins can post. New members must be
            added as admins.
          </p>
        )}
        {isClosed && !canAddAdmin && (
          <p style={{ fontSize: 12, opacity: 0.6, margin: '0 0 12px' }}>
            Only the channel creator can add members to a closed channel.
          </p>
        )}

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
            disabled={!validAddress || saving || (isClosed && !canAddAdmin)}
          >
            {saving
              ? 'Adding...'
              : `Add ${role === 'admin' ? 'admin' : 'user'}`}
          </Button>
          <Button shadow_box onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
