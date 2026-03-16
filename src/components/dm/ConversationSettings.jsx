import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { useShadownetStore } from '@context/shadownetStore'
import { useConversationList } from '@data/messaging/dm'
import {
  updateParticipants,
  updateDmAdmins,
  deleteConversation,
} from '@data/messaging/dm-actions'
import styles from '@style'

export default function ConversationSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const conversationId = id ? parseInt(id) : undefined
  const address = useShadownetStore((st) => st.address)
  const {
    data: conversations,
    isLoading,
    mutate: refresh,
  } = useConversationList(address)

  const [participantAddress, setParticipantAddress] = useState('')
  const [adminAddress, setAdminAddress] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const conversation = conversations?.find((c) => c.id === conversationId)
  const isCreator = address && conversation && address === conversation.creator

  if (isLoading) {
    return (
      <Page title="Conversation Settings">
        <Loading message="Loading..." />
      </Page>
    )
  }

  if (!conversation || !address) {
    return (
      <Page title="Conversation Settings">
        <div className={styles.container}>
          <p className={styles.empty}>Conversation not found.</p>
          <Button to="/messages/dm">Back to messages</Button>
        </div>
      </Page>
    )
  }

  const name = conversation.metadata?.name || `Conversation #${conversationId}`

  const handleAddParticipant = async () => {
    const addr = participantAddress.trim()
    if (busy || !addr || conversationId === undefined) return
    setBusy(true)
    try {
      await updateParticipants({ conversationId, toAdd: [addr], toRemove: [] })
      setParticipantAddress('')
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveParticipant = async (addr) => {
    if (busy || conversationId === undefined) return
    setBusy(true)
    try {
      await updateParticipants({ conversationId, toAdd: [], toRemove: [addr] })
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleAddAdmin = async () => {
    const addr = adminAddress.trim()
    if (busy || !addr || conversationId === undefined) return
    setBusy(true)
    try {
      await updateDmAdmins({ conversationId, toAdd: [addr], toRemove: [] })
      setAdminAddress('')
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (busy || conversationId === undefined) return
    setBusy(true)
    try {
      await deleteConversation(conversationId)
      navigate('/messages/dm')
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page title={`Settings - ${name}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headline}>{name} - Settings</h1>
        </div>

        <p>Created by {conversation.creator}</p>

        {/* Participants */}
        <div className={styles.settingsSection}>
          <div className={styles.sectionTitle}>Participants</div>
          {conversation.participants.length > 0 ? (
            conversation.participants.map((addr) => (
              <div
                key={addr}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '13px',
                }}
              >
                <span style={{ flex: 1 }}>{addr}</span>
                {addr !== conversation.creator && (
                  <button
                    className={styles.dangerBtn}
                    onClick={() => handleRemoveParticipant(addr)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          ) : (
            <p style={{ fontSize: '13px', opacity: 0.7 }}>
              No participants yet.
            </p>
          )}
          <div className={styles.field}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className={styles.label}>Add Participant</label>
            <input
              className={styles.input}
              value={participantAddress}
              onChange={(e) => setParticipantAddress(e.target.value)}
              placeholder="tz1..."
            />
          </div>
          <Button onClick={handleAddParticipant} disabled={busy}>
            Add Participant
          </Button>
        </div>

        {/* Admin Management — creator only */}
        {isCreator && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionTitle}>Manage Admins</div>
            <div className={styles.field}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={styles.label}>Add Admin</label>
              <input
                className={styles.input}
                value={adminAddress}
                onChange={(e) => setAdminAddress(e.target.value)}
                placeholder="tz1..."
              />
            </div>
            <Button onClick={handleAddAdmin} disabled={busy}>
              Add Admin
            </Button>
          </div>
        )}

        {/* Danger Zone — creator only */}
        {isCreator && (
          <div className={styles.settingsSection}>
            <div className={styles.sectionTitle}>Danger Zone</div>
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={styles.dangerBtn}
                  onClick={handleDelete}
                  disabled={busy}
                >
                  Confirm Delete
                </button>
                <Button
                  secondary
                  onClick={() => setConfirmDelete(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                className={styles.dangerBtn}
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                Delete Conversation
              </button>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <Button secondary to={`/messages/dm/${conversationId}`}>
            Back to Conversation
          </Button>
        </div>
      </div>
    </Page>
  )
}
