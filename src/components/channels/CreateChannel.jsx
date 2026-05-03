import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { createChannel, createDmChannel } from '@data/messaging/channel-actions'
import { getUser } from '@data/api'
import { useUserStore } from '@context/userStore'
import { isTzAddress, walletPreview } from '@utils/string'
import styles from './index.module.scss'

export default function CreateChannel() {
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)
  const [searchParams] = useSearchParams()
  const dmRecipient = searchParams.get('dm') || ''
  const isDm = isTzAddress(dmRecipient)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [accessMode, setAccessMode] = useState('unrestricted')
  const [allowlistText, setAllowlistText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recipientAlias, setRecipientAlias] = useState(null)
  const [aliasResolved, setAliasResolved] = useState(false)

  useEffect(() => {
    if (!isDm) return
    let cancelled = false
    setAliasResolved(false)
    getUser(dmRecipient)
      .then((u) => {
        if (cancelled) return
        setRecipientAlias(u?.name || null)
        setAliasResolved(true)
      })
      .catch(() => {
        if (!cancelled) setAliasResolved(true)
      })
    return () => {
      cancelled = true
    }
  }, [isDm, dmRecipient])

  const recipientLabel =
    recipientAlias || (isDm ? walletPreview(dmRecipient) : '')

  useEffect(() => {
    if (isDm && aliasResolved && !name && recipientLabel) {
      setName(`DM with ${recipientLabel}`)
    }
  }, [isDm, aliasResolved, recipientLabel, name])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || submitting || !address) return
    setSubmitting(true)

    try {
      if (isDm) {
        const { channelId } = await createDmChannel({
          recipient: dmRecipient,
          creator: address,
          name: name.trim(),
          description: description.trim(),
        })
        navigate(
          channelId
            ? `/messages/channels/${channelId}`
            : `/messages/dm/${dmRecipient}`
        )
        return
      }

      const merkleAddresses =
        accessMode === 'allowlist'
          ? allowlistText
              .split(/[\n,]+/)
              .map((a) => a.trim())
              .filter(Boolean)
          : undefined

      const { channelId } = await createChannel({
        kind: 'channel',
        name: name.trim(),
        description: description.trim(),
        imageFile,
        accessMode,
        merkleAddresses,
        creator: address,
      })

      navigate(channelId ? `/messages/channels/${channelId}` : '/messages')
    } catch (err) {
      console.error('Create channel failed:', err)
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
    <Page title={isDm ? 'Start DM' : 'Create Channel'}>
      <div className={styles.container}>
        <h2 className={styles.headline}>
          {isDm ? `Start DM with ${recipientLabel}` : 'Create Channel'}
        </h2>

        <form onSubmit={handleSubmit} className={styles.createForm}>
          <label className={styles.formLabel}>
            Name
            <input
              type="text"
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isDm ? 'DM name (visible to both)' : 'Channel name'}
              required
            />
          </label>

          <label className={styles.formLabel}>
            Description{' '}
            {isDm && <span style={{ opacity: 0.6 }}>(optional)</span>}
            <textarea
              className={styles.formTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isDm
                  ? 'Optional note about this DM'
                  : 'What is this channel about?'
              }
              rows={3}
            />
          </label>

          {!isDm && (
            <>
              <label className={styles.formLabel}>
                Image (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>

              <label className={styles.formLabel}>
                Access mode
                <select
                  className={styles.formInput}
                  value={accessMode}
                  onChange={(e) => setAccessMode(e.target.value)}
                >
                  <option value="unrestricted">
                    Unrestricted (anyone can post)
                  </option>
                  <option value="allowlist">
                    Allowlist (specific addresses, Merkle proofs)
                  </option>
                  <option value="closed">
                    Closed (only creator + admins can post)
                  </option>
                </select>
              </label>

              {accessMode === 'allowlist' && (
                <label className={styles.formLabel}>
                  Allowlist addresses (one per line or comma-separated)
                  <textarea
                    className={styles.formTextarea}
                    value={allowlistText}
                    onChange={(e) => setAllowlistText(e.target.value)}
                    placeholder="tz1abc..., tz1def..."
                    rows={4}
                    required
                  />
                </label>
              )}
            </>
          )}

          <Button shadow_box disabled={submitting || !name.trim()}>
            {submitting
              ? isDm
                ? 'Starting DM...'
                : 'Creating...'
              : isDm
              ? 'Start DM'
              : 'Create Channel'}
          </Button>
        </form>
      </div>
    </Page>
  )
}
