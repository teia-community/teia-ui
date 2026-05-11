import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { useChannel, useChannelAdmins } from '@data/messaging/channels'
import {
  configureChannel,
  updateChannelAdmins,
  removeMerkleUsers,
  setChannelHidden,
} from '@data/messaging/channel-actions'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { walletPreview } from '@utils/string'
import styles from './index.module.scss'

export default function ChannelSettings() {
  const { id } = useParams()
  const channelId = id || undefined
  const navigate = useNavigate()
  const address = useUserStore((st) => st.address)
  const {
    data: channel,
    isLoading,
    mutate: refreshChannel,
  } = useChannel(channelId)
  const { data: admins, mutate: refreshAdmins } = useChannelAdmins(channelId)

  const ask = useModalStore((s) => s.ask)
  const [accessMode, setAccessMode] = useState('')
  const [allowlistText, setAllowlistText] = useState('')
  const [adminText, setAdminText] = useState('')
  const [saving, setSaving] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (channel && !initializedRef.current) {
      initializedRef.current = true
      setAccessMode(channel.accessMode)
      if (
        channel.accessMode === 'allowlist' &&
        (channel.merkleUsers?.length ?? 0) > 0
      ) {
        setAllowlistText(channel.merkleUsers.join(', '))
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

  const isCreator = address && channel && address === channel.creator
  const isAdmin = address && admins && admins.includes(address)
  const canConfigure = isCreator || isAdmin

  if (!channel || !canConfigure) {
    return (
      <Page title="Channel Settings">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p>Only the channel creator and admins can access settings.</p>
          <Link to={`/messages/channels/${channelId}`}>Back to channel</Link>
        </div>
      </Page>
    )
  }

  const handleSaveAccess = async () => {
    // In closed mode the creator cannot delete a peer's message. Switching
    // out re-grants creator delete power over prior peer messages — call
    // that out before submitting the tx.
    if (channel.accessMode === 'closed' && accessMode !== 'closed') {
      const ok = await ask(
        'Switch access mode?',
        'Switching out of "closed" lets the channel creator delete prior peer messages. Continue?'
      )
      if (!ok) return
    }

    setSaving(true)
    try {
      const merkleAddresses =
        accessMode === 'allowlist'
          ? allowlistText
              .split(/[\n,]+/)
              .map((a) => a.trim())
              .filter(Boolean)
          : undefined

      await configureChannel({
        channelId,
        accessMode,
        merkleAddresses,
      })
      refreshChannel()
    } catch (e) {
      console.error('Configure failed:', e)
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
      refreshAdmins()
    } catch (e) {
      console.error('Admin add failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAdmin = async (admin) => {
    if (
      !(await ask('Remove admin?', `Remove ${walletPreview(admin)} as admin?`))
    )
      return
    setSaving(true)
    try {
      await updateChannelAdmins({
        channelId,
        toAdd: [],
        toRemove: [admin],
      })
      refreshAdmins()
    } catch (e) {
      console.error('Admin remove failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMerkleUser = async (user) => {
    if (
      !(await ask(
        'Remove from allowlist?',
        `Remove ${walletPreview(user)} from the allowlist?`
      ))
    )
      return
    setSaving(true)
    try {
      await removeMerkleUsers({
        channelId,
        currentList: channel.merkleUsers ?? [],
        addresses: [user],
      })
      refreshChannel()
    } catch (e) {
      console.error('Remove user failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleHide = async () => {
    if (!isCreator) return
    if (
      !(await ask(
        'Hide channel?',
        'It will no longer appear in lists and posting will fail.'
      ))
    )
      return
    await setChannelHidden(channelId, true)
    navigate('/messages')
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
          <h3>Access mode</h3>
          <select
            className={styles.formInput}
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value)}
          >
            <option value="unrestricted">Unrestricted</option>
            <option value="allowlist">Allowlist (Merkle)</option>
            <option value="closed">Closed (creator + admins only)</option>
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
            {saving ? 'Saving...' : 'Save access mode'}
          </Button>
        </div>

        <div className={styles.settingsSection}>
          <h3>Admins</h3>
          {(admins?.length ?? 0) === 0 && (
            <p style={{ fontSize: 13, opacity: 0.6 }}>No admins yet.</p>
          )}
          {(admins?.length ?? 0) > 0 && (
            <ul style={{ fontSize: 13, paddingLeft: 0, listStyle: 'none' }}>
              {admins.map((a) => (
                <li
                  key={a}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                  }}
                >
                  <span>{a}</span>
                  {isCreator && (
                    <Button
                      shadow_box
                      onClick={() => handleRemoveAdmin(a)}
                      disabled={saving}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isCreator ? (
            <>
              <textarea
                className={styles.formTextarea}
                value={adminText}
                onChange={(e) => setAdminText(e.target.value)}
                placeholder="Addresses to add as admin"
                rows={2}
              />
              <Button shadow_box onClick={handleAddAdmin} disabled={saving}>
                Add admin
              </Button>
            </>
          ) : (
            <p style={{ fontSize: 13, opacity: 0.6 }}>
              Only the channel creator can add or remove admins.
            </p>
          )}
        </div>

        {accessMode === 'allowlist' && (
          <div className={styles.settingsSection}>
            <h3>Allowlist users</h3>
            {(channel.merkleUsers?.length ?? 0) === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.6 }}>
                No allowlist users. Add some in the access-mode section above.
              </p>
            ) : (
              <ul style={{ fontSize: 13, paddingLeft: 0, listStyle: 'none' }}>
                {channel.merkleUsers.map((u) => (
                  <li
                    key={u}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <span>{u}</span>
                    <Button
                      shadow_box
                      onClick={() => handleRemoveMerkleUser(u)}
                      disabled={saving}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isCreator && (
          <div className={styles.settingsSection}>
            <h3>Danger zone</h3>
            <Button shadow_box onClick={handleHide} disabled={saving}>
              Hide channel
            </Button>
          </div>
        )}
      </div>
    </Page>
  )
}
