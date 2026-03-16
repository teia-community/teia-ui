/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { createChannel } from '@data/messaging/channel-actions'
import { useChannelFees } from '@data/messaging/channels'
import { useShadownetStore } from '@context/shadownetStore'
import { computeMerkleRoot } from '@utils/merkle'
import styles from '@style'

export default function CreateChannel() {
  const navigate = useNavigate()
  const address = useShadownetStore((st) => st.address)
  const { channelFee } = useChannelFees()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accessMode, setAccessMode] = useState('unrestricted')
  const [addressList, setAddressList] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }, [])

  const handleRemoveImage = useCallback(() => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }, [imagePreview])

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || submitting) return
    setSubmitting(true)

    try {
      let merkleRoot = undefined
      let merkleUri = undefined
      let blocklistAddresses = undefined

      if (accessMode === 'allowlist' && addressList.trim()) {
        const addresses = addressList
          .split(/[,\n]/)
          .map((a) => a.trim())
          .filter(Boolean)
        merkleRoot = computeMerkleRoot(addresses)
        merkleUri = addresses
      }

      if (accessMode === 'blocklist' && addressList.trim()) {
        blocklistAddresses = addressList
          .split(/[,\n]/)
          .map((a) => a.trim())
          .filter(Boolean)
      }

      const result = await createChannel({
        name: name.trim(),
        description: description.trim(),
        imageFile: imageFile || undefined,
        accessMode,
        channelFee,
        merkleRoot,
        merkleUri,
        blocklistAddresses,
      })

      navigate(`/messages/channels/${result.channelId}`)
    } catch (e) {
      console.error('Create failed:', e)
    } finally {
      setSubmitting(false)
    }
  }, [
    name,
    description,
    imageFile,
    accessMode,
    addressList,
    channelFee,
    submitting,
    navigate,
  ])

  if (!address) {
    return (
      <Page title="Create Channel">
        <div className={styles.createForm}>
          <h1 className={styles.headline}>Create Channel</h1>
          <p>Connect your Shadownet wallet first.</p>
          <Button to="/messages">Go to Messages</Button>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Create Channel">
      <div className={styles.createForm}>
        <h1 className={styles.headline}>Create Channel</h1>

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Image (optional)</label>
          {imagePreview ? (
            <div className={styles.imagePreviewWrap}>
              <img
                src={imagePreview}
                alt="Channel preview"
                className={styles.imagePreview}
              />
              <button
                type="button"
                className={styles.removeImageBtn}
                onClick={handleRemoveImage}
              >
                Remove
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              className={styles.input}
              onChange={handleImageChange}
            />
          )}
          <div className={styles.help}>
            Upload an image for the channel. It will be stored on IPFS.
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Access Mode</label>
          <select
            className={styles.select}
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value)}
          >
            <option value="unrestricted">Unrestricted (anyone can post)</option>
            <option value="allowlist">Allowlist (Merkle proof required)</option>
            <option value="blocklist">
              Blocklist (block specific addresses)
            </option>
          </select>
        </div>

        {accessMode === 'allowlist' && (
          <div className={styles.field}>
            <label className={styles.label}>Allowed Addresses</label>
            <textarea
              className={styles.textarea}
              value={addressList}
              onChange={(e) => setAddressList(e.target.value)}
              placeholder="tz1abc..., tz1def..., tz1ghi..."
              rows={5}
            />
            <div className={styles.help}>
              Enter Tezos addresses separated by commas. A Merkle root will be
              computed and the list pinned to IPFS.
            </div>
          </div>
        )}

        {accessMode === 'blocklist' && (
          <div className={styles.field}>
            <label className={styles.label}>Blocked Addresses</label>
            <textarea
              className={styles.textarea}
              value={addressList}
              onChange={(e) => setAddressList(e.target.value)}
              placeholder="tz1abc..., tz1def..., tz1ghi..."
              rows={5}
            />
            <div className={styles.help}>
              Enter addresses to block, separated by commas. You can add/remove
              later from settings.
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            shadow_box
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Creating...' : 'Create Channel'}
          </Button>
          <Button shadow_box secondary to="/messages/channels">
            Cancel
          </Button>
        </div>

        {channelFee > 0 && (
          <div className={styles.help} style={{ marginTop: '0.5rem' }}>
            Channel creation fee: {(channelFee / 1e6).toFixed(6)} tez
          </div>
        )}
      </div>
    </Page>
  )
}
