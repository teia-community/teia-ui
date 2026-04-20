import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atoms/button'
import { walletPreview, isTzAddress } from '@utils/string'
import { MESSAGING_CHANNEL_FEE } from '@constants'
import { useUsers } from '@data/swr'
import { computeMerkleRoot } from '@utils/merkle'
import { createChannel } from '@data/messaging/channel-actions'
import { useClickOutside } from '@hooks/use-click-outside'
import UserSearchDropdown from './UserSearchDropdown'
import styles from './index.module.scss'

export default function ConvertToChannelModal({
  myAddress,
  peerAddress,
  onClose,
}) {
  const navigate = useNavigate()
  const contentRef = useRef(null)
  const [users] = useUsers([myAddress, peerAddress])
  const myName = users[myAddress]?.alias || walletPreview(myAddress)
  const peerName = users[peerAddress]?.alias || walletPreview(peerAddress)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [newUserValue, setNewUserValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const validAddress = isTzAddress(newUserValue)

  useClickOutside(contentRef, onClose)

  const handleCreate = async () => {
    if (!name.trim() || !validAddress || submitting) return
    setSubmitting(true)

    try {
      const members = [myAddress, peerAddress, newUserValue.trim()]
      const merkleRoot = computeMerkleRoot(members)

      const result = await createChannel({
        name,
        description,
        imageFile,
        accessMode: 'allowlist',
        channelFee: MESSAGING_CHANNEL_FEE,
        merkleRoot,
        merkleUri: members,
      })

      navigate(`/messages/channels/${result.channelId}`)
    } catch (e) {
      console.error('Create channel failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={contentRef}>
        <h3 style={{ margin: '0 0 8px' }}>Make this DM a Channel</h3>
        <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 20px' }}>
          Direct messages are between two people. To include more users, create
          a channel. All three wallets will be added to the channel's allowlist.
        </p>

        <div className={styles.modalForm}>
          <label className={styles.modalLabel}>
            Channel Name
            <input
              type="text"
              className={styles.modalInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Channel name"
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus
            />
          </label>

          <label className={styles.modalLabel}>
            Description (optional)
            <textarea
              className={styles.modalTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              rows={2}
            />
          </label>

          <label className={styles.modalLabel}>
            Image (optional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className={styles.modalLabel}>
            <span>Members</span>
            <div className={styles.membersList}>
              <div className={styles.memberRow}>
                {myName} <span style={{ opacity: 0.5 }}>(you)</span>
              </div>
              <div className={styles.memberRow}>{peerName}</div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={newUserValue}
                  onChange={(e) => {
                    setNewUserValue(e.target.value)
                    setShowDropdown(true)
                  }}
                  placeholder="Add third user (tz address or name)..."
                />
                {showDropdown && !validAddress && (
                  <UserSearchDropdown
                    query={newUserValue}
                    onSelect={(user) => {
                      setNewUserValue(user.user_address)
                      setShowDropdown(false)
                    }}
                    onClose={() => setShowDropdown(false)}
                  />
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button
              shadow_box
              onClick={handleCreate}
              disabled={!name.trim() || !validAddress || submitting}
            >
              {submitting ? 'Creating...' : 'Create Channel'}
            </Button>
            <Button shadow_box onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
