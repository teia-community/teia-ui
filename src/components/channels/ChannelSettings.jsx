import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { useChannel, useChannelAdmins } from '@data/messaging/channels'
import {
  configureChannel,
  updateBlocklist,
  updateChannelAdmins,
  hideChannel,
  deleteChannel,
} from '@data/messaging/channel-actions'
import { computeMerkleRoot } from '@utils/merkle'
import { useUserStore } from '@context/userStore'
import styles from './index.module.scss'

export default function ChannelSettings() {
  const { id } = useParams()
  const channelId = id || undefined
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)
  const { data: channel, isLoading } = useChannel(channelId)
  const { data: admins } = useChannelAdmins(channelId)

  const [accessMode, setAccessMode] = useState('')
  const [allowlistText, setAllowlistText] = useState('')
  const [blocklistText, setBlocklistText] = useState('')
  const [adminText, setAdminText] = useState('')
  const [saving, setSaving] = useState(false)
  const initializedRef = useRef(false)

  // Initialize form state from channel data (once)
  useEffect(() => {
    if (channel && !initializedRef.current) {
      initializedRef.current = true
      setAccessMode(channel.accessMode)
      if (channel.accessMode === 'allowlist' && channel.allowlist?.length > 0) {
        setAllowlistText(channel.allowlist.join(', '))
      }
    }
  }, [channel])

  if (isLoading) {
    return (
      <Page title="Channel Settings">
        <Loading />
      </Page>
    )
  }

  if (!channel || !address || address !== channel.creator) {
    return (
      <Page title="Channel Settings">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p>Only the channel creator can access settings.</p>
          <Link to={`/messages/channels/${channelId}`}>Back to channel</Link>
        </div>
      </Page>
    )
  }

  const handleSaveAccess = async () => {
    setSaving(true)
    try {
      const allowlistAddresses = allowlistText
        .split(/[\n,]+/)
        .map((a) => a.trim())
        .filter(Boolean)

      let merkleRoot
      let merkleUri
      if (accessMode === 'allowlist' && allowlistAddresses.length > 0) {
        merkleRoot = computeMerkleRoot(allowlistAddresses)
        merkleUri = allowlistAddresses
      }

      await configureChannel({
        channelId,
        accessMode,
        merkleRoot,
        merkleUri,
      })
    } catch (e) {
      console.error('Configure failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateBlocklist = async () => {
    const addresses = blocklistText
      .split(/[\n,]+/)
      .map((a) => a.trim())
      .filter(Boolean)
    if (addresses.length === 0) return

    setSaving(true)
    try {
      await updateBlocklist({
        channelId,
        toBlock: addresses,
        toUnblock: [],
      })
      setBlocklistText('')
    } catch (e) {
      console.error('Blocklist update failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleAddAdmin = async () => {
    const addresses = adminText
      .split(/[\n,]+/)
      .map((a) => a.trim())
      .filter(Boolean)
    if (addresses.length === 0) return

    setSaving(true)
    try {
      await updateChannelAdmins({
        channelId,
        toAdd: addresses,
        toRemove: [],
      })
      setAdminText('')
    } catch (e) {
      console.error('Admin update failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleHide = async () => {
    if (
      !window.confirm(
        'Hide this channel? It will no longer appear in the list.'
      )
    )
      return
    await hideChannel(channelId)
    navigate('/messages/channels')
  }

  const handleDelete = async () => {
    if (
      !window.confirm('Permanently delete this channel? This cannot be undone.')
    )
      return
    await deleteChannel(channelId)
    navigate('/messages/channels')
  }

  return (
    <Page title="Channel Settings">
      <div className={styles.container}>
        <Link
          to={`/messages/channels/${channelId}`}
          style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}
        >
          ← Back to channel
        </Link>
        <h2 className={styles.headline}>
          Settings: {channel.metadata?.name || `Channel #${channelId}`}
        </h2>

        <div className={styles.settingsSection}>
          <h3>Access Mode</h3>
          <select
            className={styles.formInput}
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value)}
          >
            <option value="unrestricted">Unrestricted</option>
            <option value="members_only">Members Only</option>
            <option value="allowlist">Allowlist</option>
            <option value="blocklist">Blocklist</option>
          </select>

          {accessMode === 'allowlist' && (
            <textarea
              className={styles.formTextarea}
              value={allowlistText}
              onChange={(e) => setAllowlistText(e.target.value)}
              placeholder="Allowlist addresses (comma or newline separated)"
              rows={4}
            />
          )}

          <Button shadow_box onClick={handleSaveAccess} disabled={saving}>
            {saving ? 'Saving...' : 'Save Access Mode'}
          </Button>
        </div>

        {accessMode === 'blocklist' && (
          <div className={styles.settingsSection}>
            <h3>Blocklist</h3>
            <textarea
              className={styles.formTextarea}
              value={blocklistText}
              onChange={(e) => setBlocklistText(e.target.value)}
              placeholder="Addresses to block"
              rows={3}
            />
            <Button
              shadow_box
              onClick={handleUpdateBlocklist}
              disabled={saving}
            >
              Add to Blocklist
            </Button>
          </div>
        )}

        <div className={styles.settingsSection}>
          <h3>Admins</h3>
          {admins?.length > 0 && (
            <ul style={{ fontSize: 13, paddingLeft: 20 }}>
              {admins.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <textarea
            className={styles.formTextarea}
            value={adminText}
            onChange={(e) => setAdminText(e.target.value)}
            placeholder="Addresses to add as admin"
            rows={2}
          />
          <Button shadow_box onClick={handleAddAdmin} disabled={saving}>
            Add Admin
          </Button>
        </div>

        <div className={styles.settingsSection}>
          <h3>Danger Zone</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button shadow_box onClick={handleHide}>
              Hide Channel
            </Button>
            <Button shadow_box onClick={handleDelete}>
              Delete Channel
            </Button>
          </div>
        </div>
      </div>
    </Page>
  )
}
