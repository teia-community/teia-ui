import { useState, useRef, useCallback } from 'react'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import styles from './index.module.scss'

export default function CommentForm({
  onSubmit,
  replyTo,
  onCancelReply,
  disabled,
  disabledMessage,
  placeholder = 'Add a comment...',
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onSubmit({ text: trimmed })
      setText('')
      if (onCancelReply) onCancelReply()
    } catch (e) {
      console.error('Post comment failed:', e)
    } finally {
      setSending(false)
    }
  }, [text, sending, onSubmit, onCancelReply])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={styles.form}>
      {replyTo && (
        <div className={styles.replyBanner}>
          <span>
            Replying to <strong>{walletPreview(replyTo.sender)}</strong>:{' '}
            {replyTo.content.length > 80
              ? replyTo.content.slice(0, 80) + '...'
              : replyTo.content}
          </span>
          <button onClick={onCancelReply} aria-label="Cancel reply">
            &times;
          </button>
        </div>
      )}
      <div className={styles.formRow}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={disabled ? disabledMessage : placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          rows={3}
        />
        <Button
          shadow_box
          onClick={handleSubmit}
          disabled={disabled || sending || !text.trim()}
        >
          {sending ? '...' : 'Post'}
        </Button>
      </div>
    </div>
  )
}
