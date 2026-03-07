import { useState } from 'react'
import { useOutletContext, useParams, Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { RecipientInput } from '@components/messaging/RecipientInput'
import { useMessagingStore } from '@context/messagingStore'
import { useMessageFee } from '@data/messaging'
import styles from '@style'

const MAX_CHARS = 16000

export default function Compose() {
  const { storage, address } = useOutletContext()
  const { prefillAddress } = useParams()
  const fee = useMessageFee(storage)

  const [recipients, setRecipients] = useState(
    prefillAddress ? [prefillAddress] : ['']
  )
  const [content, setContent] = useState('')
  const [replyMode, setReplyMode] = useState('open')

  const sendMessage = useMessagingStore((st) => st.sendMessage)

  if (!address) {
    return (
      <div className={styles.empty}>
        <p>
          <Link to="/sync">Sync your wallet</Link> to send messages.
        </p>
      </div>
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

  const validRecipients = recipients.filter((r) => r.trim().length >= 36)

  const handleSend = async () => {
    if (!content.trim() || validRecipients.length === 0) return
    await sendMessage(content.trim(), validRecipients, replyMode, fee)
  }

  return (
    <div className={styles.compose_form}>
      <div className={styles.compose_section}>
        <p className={styles.compose_label}>Recipients</p>
        {recipients.map((r, i) => (
          <RecipientInput
            key={i}
            value={r}
            onChange={(val) => updateRecipient(i, val)}
            onRemove={() => removeRecipient(i)}
            showRemove={recipients.length > 1}
          />
        ))}
        <Button small onClick={addRecipient}>
          + Add recipient
        </Button>
      </div>

      <div className={styles.compose_section}>
        <label htmlFor="compose-message" className={styles.compose_label}>
          Message
        </label>
        <textarea
          id="compose-message"
          className={styles.compose_textarea}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Write your message..."
        />
        <div className={styles.compose_meta}>
          <span>
            {content.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <div className={styles.compose_section}>
        <p className={styles.compose_label}>Reply mode</p>
        <div className={styles.compose_mode_row}>
          <Button
            shadow_box
            selected={replyMode === 'open'}
            onClick={() => setReplyMode('open')}
          >
            Public
          </Button>
          <Button
            shadow_box
            selected={replyMode === 'sender_only'}
            onClick={() => setReplyMode('sender_only')}
          >
            Private
          </Button>
        </div>
        <p className={styles.compose_mode_hint}>
          {replyMode === 'sender_only'
            ? 'Only you can reply to this thread.'
            : 'All participants can reply to this thread.'}
        </p>
      </div>

      <div className={styles.compose_actions}>
        <Button
          shadow_box
          onClick={handleSend}
          disabled={!content.trim() || validRecipients.length === 0}
        >
          Send Message
        </Button>
        {fee > 0 && (
          <span className={styles.compose_fee}>Fee: {fee / 1000000} tez</span>
        )}
      </div>
    </div>
  )
}
