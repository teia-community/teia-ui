import { useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { useShadownetStore } from '@context/shadownetStore'
import { useUserProfiles } from '@data/swr'
import { useDmFees } from '@data/messaging/dm'
import { createConversation } from '@data/messaging/dm-actions'
import DmRecipientInput from './DmRecipientInput'
import styles from '@style'

const MAX_PARTICIPANTS = 12

export default function CreateConversation() {
  const { prefillAddress } = useParams()
  const address = useShadownetStore((s) => s.address)
  const { conversationFee } = useDmFees()
  const navigate = useNavigate()

  const [recipients, setRecipients] = useState(
    prefillAddress ? [prefillAddress] : ['']
  )
  const [customName, setCustomName] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validRecipients = recipients.filter((r) => r.trim().length >= 36)

  // Resolve names for current user + all valid recipients
  const allAddresses = useMemo(() => {
    const addrs = [...validRecipients]
    if (address) addrs.push(address)
    return [...new Set(addrs)]
  }, [validRecipients, address])

  const [profiles] = useUserProfiles(
    allAddresses.length > 0 ? allAddresses : undefined
  )

  // Auto-generate conversation name
  const myAlias = profiles?.[address]?.name || walletPreview(address)
  const autoName = useMemo(() => {
    if (validRecipients.length === 0) return ''
    if (validRecipients.length > 1) return 'multichat'
    const otherAlias =
      profiles?.[validRecipients[0]]?.name || walletPreview(validRecipients[0])
    return `${myAlias}X${otherAlias}`
  }, [validRecipients, profiles, myAlias])

  const effectiveName = customName ? name : autoName

  if (!address) {
    return (
      <Page title="New Conversation">
        <div className={styles.empty}>
          <p>
            <Link to="/messages">Connect your Shadownet wallet</Link> to create
            conversations.
          </p>
        </div>
      </Page>
    )
  }

  const updateRecipient = (index, value) => {
    const updated = [...recipients]
    updated[index] = value
    setRecipients(updated)
  }

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  const addRecipient = () => {
    setRecipients([...recipients, ''])
  }

  const handleSend = async () => {
    if (!effectiveName || validRecipients.length === 0 || submitting) return

    setSubmitting(true)
    try {
      await createConversation({
        name: effectiveName,
        description: '',
        participants: validRecipients,
        conversationFee,
      })
      navigate('/messages/dm')
    } catch {
      // error handled by modal
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page title="New Conversation">
      <div className={styles.compose_form}>
        <Link
          to="/messages/dm"
          style={{
            fontSize: '13px',
            display: 'inline-block',
            marginBottom: 12,
          }}
        >
          &larr; Back to Messages
        </Link>

        <div className={styles.compose_section}>
          <p className={styles.compose_label}>Recipients</p>
          {recipients.map((r, i) => (
            <DmRecipientInput
              key={i}
              value={r}
              onChange={(val) => updateRecipient(i, val)}
              onRemove={() => removeRecipient(i)}
              showRemove={recipients.length > 1}
            />
          ))}
          {recipients.length < MAX_PARTICIPANTS && (
            <Button small onClick={addRecipient}>
              + Add recipient
            </Button>
          )}
        </div>

        <div className={styles.compose_section}>
          <p className={styles.compose_label}>
            Conversation Name: {effectiveName || '—'}
          </p>
          <label
            className={styles.compose_mode_hint}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <input
              type="checkbox"
              checked={customName}
              onChange={(e) => {
                setCustomName(e.target.checked)
                if (e.target.checked) setName(autoName)
              }}
            />
            Set custom name
          </label>
          {customName && (
            <input
              className={styles.recipient_input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Custom conversation name"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: 8,
              }}
            />
          )}
        </div>

        <div className={styles.compose_actions}>
          <Button
            shadow_box
            onClick={handleSend}
            disabled={
              submitting || !effectiveName || validRecipients.length === 0
            }
          >
            {submitting ? 'Creating...' : 'Start Conversation'}
          </Button>
          {conversationFee > 0 && (
            <span className={styles.compose_fee}>
              Fee: {conversationFee / 1e6} tez
            </span>
          )}
        </div>
      </div>
    </Page>
  )
}
