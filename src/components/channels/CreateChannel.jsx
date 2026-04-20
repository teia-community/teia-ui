import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { MESSAGING_CHANNEL_FEE } from '@constants'
import { createChannel } from '@data/messaging/channel-actions'
import { uploadMsgJsonToIPFS } from '@data/messaging/ipfs'
import { computeMerkleRoot } from '@utils/merkle'
import { useUserStore } from '@context/userStore'
import styles from './index.module.scss'

export default function CreateChannel() {
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)
  const channelFee = MESSAGING_CHANNEL_FEE

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [accessMode, setAccessMode] = useState('unrestricted')
  const [allowlistText, setAllowlistText] = useState('')
  const [blocklistText, setBlocklistText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)

    try {
      const allowlistAddresses = allowlistText
        .split(/[\n,]+/)
        .map((a) => a.trim())
        .filter(Boolean)

      const blocklistAddresses = blocklistText
        .split(/[\n,]+/)
        .map((a) => a.trim())
        .filter(Boolean)

      let merkleRoot
      let merkleUri
      if (accessMode === 'allowlist' && allowlistAddresses.length > 0) {
        merkleRoot = computeMerkleRoot(allowlistAddresses)
        merkleUri = allowlistAddresses
      }

      const result = await createChannel({
        name,
        description,
        imageFile,
        accessMode,
        channelFee,
        merkleRoot,
        merkleUri,
        blocklistAddresses:
          accessMode === 'blocklist' ? blocklistAddresses : undefined,
      })

      navigate(`/messages/channels/${result.channelId}`)
    } catch (e) {
      console.error('Create channel failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!address) {
    return (
      <Page title="Create Channel">
        <div style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>
          Connect your wallet to create a channel.
        </div>
      </Page>
    )
  }

  return (
    <Page title="Create Channel">
      <div className={styles.container}>
        <h2 className={styles.headline}>Create Channel</h2>

        <form onSubmit={handleSubmit} className={styles.createForm}>
          <label className={styles.formLabel}>
            Name
            <input
              type="text"
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Channel name"
              required
            />
          </label>

          <label className={styles.formLabel}>
            Description
            <textarea
              className={styles.formTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              rows={3}
            />
          </label>

          <label className={styles.formLabel}>
            Image (optional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className={styles.formLabel}>
            Access Mode
            <select
              className={styles.formInput}
              value={accessMode}
              onChange={(e) => setAccessMode(e.target.value)}
            >
              <option value="unrestricted">
                Unrestricted (anyone can post)
              </option>
              <option value="members_only">
                Members Only (creator/admins)
              </option>
              <option value="allowlist">Allowlist (specific addresses)</option>
              <option value="blocklist">
                Blocklist (block specific addresses)
              </option>
            </select>
          </label>

          {accessMode === 'allowlist' && (
            <label className={styles.formLabel}>
              Allowlist Addresses (one per line or comma-separated)
              <textarea
                className={styles.formTextarea}
                value={allowlistText}
                onChange={(e) => setAllowlistText(e.target.value)}
                placeholder="tz1abc..., tz1def..."
                rows={4}
              />
            </label>
          )}

          {accessMode === 'blocklist' && (
            <label className={styles.formLabel}>
              Blocklist Addresses (one per line or comma-separated)
              <textarea
                className={styles.formTextarea}
                value={blocklistText}
                onChange={(e) => setBlocklistText(e.target.value)}
                placeholder="tz1abc..., tz1def..."
                rows={4}
              />
            </label>
          )}

          <Button shadow_box disabled={submitting || !name.trim()}>
            {submitting ? 'Creating...' : 'Create Channel'}
          </Button>
        </form>
      </div>
    </Page>
  )
}
