import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { useChannel, useIsChannelAdmin, useChannelAdmins } from '@data/channels'
import { useUserProfiles } from '@data/swr'
import {
  configureChannel,
  updateBlocklist,
  updateChannelAdmins,
  updateChannel,
  hideChannel,
  deleteChannel,
} from '@data/channel-actions'
import { useShadownetStore } from '@context/shadownetStore'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { computeMerkleRoot } from '@utils/merkle'
import styles from '@style'

export default function ChannelSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const channelId = id ? parseInt(id) : undefined
  const { data: channel, isLoading, mutate: refresh } = useChannel(channelId)
  const address = useShadownetStore((st) => st.address)

  const [accessMode, setAccessMode] = useState('')
  const [allowlistAddresses, setAllowlistAddresses] = useState('')
  const [blockAddresses, setBlockAddresses] = useState('')
  const [unblockAddresses, setUnblockAddresses] = useState('')
  const [adminAddresses, setAdminAddresses] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: isAdmin } = useIsChannelAdmin(channelId, address)
  const isCreator = address && channel && address === channel.creator
  const canAccessSettings = isCreator || isAdmin

  const { data: admins, mutate: refreshAdmins } = useChannelAdmins(channelId)
  const [adminProfiles] = useUserProfiles(
    admins?.length > 0 ? admins : undefined
  )

  if (channel && !accessMode) {
    setAccessMode(channel.accessMode)
    if (channel.accessMode === 'allowlist' && channel.allowlist?.length > 0) {
      setAllowlistAddresses(channel.allowlist.join(', '))
    }
  }

  if (isLoading) {
    return (
      <Page title="Channel Settings">
        <Loading message="Loading..." />
      </Page>
    )
  }

  if (!channel || !address || (isAdmin === undefined && !isCreator)) {
    return (
      <Page title="Channel Settings">
        <Loading message="Loading..." />
      </Page>
    )
  }

  if (!canAccessSettings) {
    return (
      <Page title="Channel Settings">
        <div className={styles.createForm}>
          <p>Channel not found or you do not have access.</p>
          <Button to="/testnet/channels">Back to channels</Button>
        </div>
      </Page>
    )
  }

  const channelName = channel.metadata?.name || `Channel #${channelId}`

  const handleConfigure = async () => {
    if (busy) return
    setBusy(true)
    try {
      let merkleRoot = undefined
      let merkleUri = undefined

      if (accessMode === 'allowlist' && allowlistAddresses.trim()) {
        const addresses = allowlistAddresses
          .split(/[,\n]/)
          .map((a) => a.trim())
          .filter(Boolean)
        merkleRoot = computeMerkleRoot(addresses)
        merkleUri = addresses
      }

      await configureChannel({
        channelId,
        accessMode,
        merkleRoot,
        merkleUri,
      })
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateBlocklist = async () => {
    if (busy) return
    setBusy(true)
    try {
      const toBlock = blockAddresses
        .split(/[,\n]/)
        .map((a) => a.trim())
        .filter(Boolean)
      const toUnblock = unblockAddresses
        .split(/[,\n]/)
        .map((a) => a.trim())
        .filter(Boolean)

      await updateBlocklist({ channelId, toBlock, toUnblock })
      setBlockAddresses('')
      setUnblockAddresses('')
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleAddAdmins = async () => {
    if (busy) return
    const toAdd = adminAddresses
      .split(/[,\n]/)
      .map((a) => a.trim())
      .filter(Boolean)
    if (toAdd.length === 0) return
    setBusy(true)
    try {
      await updateChannelAdmins({ channelId, toAdd, toRemove: [] })
      setAdminAddresses('')
      refreshAdmins()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveAdmin = async (addr) => {
    if (busy) return
    setBusy(true)
    try {
      await updateChannelAdmins({ channelId, toAdd: [], toRemove: [addr] })
      refreshAdmins()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleHide = async () => {
    if (busy) return
    setBusy(true)
    try {
      await hideChannel(channelId)
      navigate('/testnet/channels')
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (busy) return
    setBusy(true)
    try {
      await deleteChannel(channelId)
      navigate('/testnet/channels')
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page title={`Settings - ${channelName}`}>
      <div className={styles.createForm}>
        <h1 className={styles.headline}>{channelName} - Settings</h1>

        {/* Access Mode */}
        <div className={styles.settingsSection}>
          <div className={styles.sectionTitle}>Access Control</div>
          <div className={styles.field}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className={styles.label}>Access Mode</label>
            <select
              className={styles.select}
              value={accessMode}
              onChange={(e) => setAccessMode(e.target.value)}
            >
              <option value="unrestricted">Unrestricted</option>
              <option value="allowlist">Allowlist</option>
              <option value="blocklist">Blocklist</option>
            </select>
          </div>

          {accessMode === 'allowlist' && (
            <div className={styles.field}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={styles.label}>Allowed Addresses</label>
              <textarea
                className={styles.textarea}
                value={allowlistAddresses}
                onChange={(e) => setAllowlistAddresses(e.target.value)}
                placeholder="tz1abc..., tz1def..., tz1ghi..."
                rows={4}
              />
            </div>
          )}

          <Button shadow_box onClick={handleConfigure} disabled={busy}>
            {busy ? 'Saving...' : 'Save Access Config'}
          </Button>
        </div>

        {/* Blocklist Management */}
        {channel.accessMode === 'blocklist' && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionTitle}>Manage Blocklist</div>
            <div className={styles.field}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={styles.label}>Block Addresses</label>
              <textarea
                className={styles.textarea}
                value={blockAddresses}
                onChange={(e) => setBlockAddresses(e.target.value)}
                placeholder="tz1abc..., tz1def..., tz1ghi..."
                rows={3}
              />
            </div>
            <div className={styles.field}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={styles.label}>Unblock Addresses</label>
              <textarea
                className={styles.textarea}
                value={unblockAddresses}
                onChange={(e) => setUnblockAddresses(e.target.value)}
                placeholder="tz1abc..., tz1def..., tz1ghi..."
                rows={3}
              />
            </div>
            <Button onClick={handleUpdateBlocklist} disabled={busy}>
              Update Blocklist
            </Button>
          </div>
        )}

        {/* Admin Management — creator only */}
        {isCreator && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionTitle}>Manage Admins</div>
            {admins && admins.length > 0 ? (
              admins.map((addr) => (
                <div
                  key={addr}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Identicon
                    address={addr}
                    logo={adminProfiles?.[addr]?.identicon}
                    className={styles.dialogAvatar}
                  />
                  <span style={{ flex: 1, fontSize: '13px' }}>
                    {adminProfiles?.[addr]?.name || walletPreview(addr)}
                  </span>
                  <button
                    className={styles.dangerBtn}
                    onClick={() => handleRemoveAdmin(addr)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '13px', opacity: 0.7 }}>No admins yet.</p>
            )}
            <div className={styles.field}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={styles.label}>Add Admins</label>
              <textarea
                className={styles.textarea}
                value={adminAddresses}
                onChange={(e) => setAdminAddresses(e.target.value)}
                placeholder="tz1abc..., tz1def..."
                rows={2}
              />
            </div>
            <Button onClick={handleAddAdmins} disabled={busy}>
              Add Admins
            </Button>
          </div>
        )}

        {/* Danger Zone — creator only */}
        {isCreator && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionTitle}>Danger Zone</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={styles.dangerBtn}
                onClick={handleHide}
                disabled={busy}
              >
                Hide Channel
              </button>
              <button
                className={styles.dangerBtn}
                onClick={handleDelete}
                disabled={busy}
              >
                Delete Channel
              </button>
            </div>
            <div className={styles.help} style={{ marginTop: '0.5rem' }}>
              Hide = soft delete (can be undone). Delete = permanent.
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button secondary to={`/testnet/channels/${channelId}`}>
            Back to Channel
          </Button>
        </div>
      </div>
    </Page>
  )
}
