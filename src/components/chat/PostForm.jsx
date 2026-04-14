import { useState, useRef, useCallback } from 'react'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { getMentionQuery } from '@utils/mentions'
import EmojiButton from '@atoms/emoji-picker/EmojiButton'
import TokenEmbedPicker from '@atoms/token-embed-picker/TokenEmbedPicker'
import TokenEmbedCard from '@atoms/token-embed-card/TokenEmbedCard'
import MentionDropdown from '@atoms/mention-input/MentionDropdown'
import styles from './index.module.scss'

/**
 * Shared post form used across channels, DMs, and token gate chats.
 *
 * Props:
 * - onSubmit(text, storageMode, embeds) — called when the user submits
 * - replyTo — message being replied to (optional)
 * - onCancelReply — callback to cancel reply
 * - disabled — disable the form (e.g. not connected)
 * - disabledMessage — message to show when disabled
 * - sending — external sending state
 */
export default function PostForm({
  onSubmit,
  replyTo,
  onCancelReply,
  disabled,
  disabledMessage = 'Connect your wallet to post messages',
  sending: externalSending,
}) {
  const [text, setText] = useState('')
  const [storageMode, setStorageMode] = useState('ipfs')
  const [internalSending, setInternalSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const [pendingEmbeds, setPendingEmbeds] = useState([])
  const textareaRef = useRef(null)

  const sending = externalSending || internalSending

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if ((!text.trim() && pendingEmbeds.length === 0) || sending) return
    setInternalSending(true)

    try {
      await onSubmit({
        text: text.trim(),
        storageMode,
        embeds: pendingEmbeds.length > 0 ? pendingEmbeds : undefined,
      })
      setText('')
      setPendingEmbeds([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      if (onCancelReply) onCancelReply()
    } catch (e) {
      console.error('Post failed:', e)
    } finally {
      setInternalSending(false)
    }
  }, [text, sending, storageMode, pendingEmbeds, onSubmit, onCancelReply])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (mentionQuery) return
      e.preventDefault()
      handleSubmit()
    }
  }

  if (disabled) {
    return <div className={styles.notAllowed}>{disabledMessage}</div>
  }

  return (
    <div className={styles.postForm}>
      {replyTo && (
        <div className={styles.replyBanner}>
          <span>
            Replying to <strong>{walletPreview(replyTo.sender)}</strong>
            {': '}
            {replyTo.content.length > 80
              ? replyTo.content.slice(0, 80) + '...'
              : replyTo.content}
          </span>
          <button className={styles.replyBannerClose} onClick={onCancelReply}>
            &times;
          </button>
        </div>
      )}
      {pendingEmbeds.length > 0 && (
        <div
          style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          {pendingEmbeds.map((embed, i) => (
            <TokenEmbedCard
              key={embed.tokenId || i}
              embed={embed}
              onRemove={() =>
                setPendingEmbeds((prev) => prev.filter((_, j) => j !== i))
              }
            />
          ))}
        </div>
      )}
      <div className={styles.postInputWrapper}>
        {mentionQuery && (
          <MentionDropdown
            query={mentionQuery.query}
            onSelect={(addr) => {
              const before = text.slice(0, mentionQuery.start)
              const after = text.slice(
                mentionQuery.start + 1 + mentionQuery.query.length
              )
              const newText = `${before}@${addr} ${after}`
              setText(newText)
              setMentionQuery(null)
              textareaRef.current?.focus()
            }}
            onClose={() => setMentionQuery(null)}
          />
        )}
        <textarea
          ref={textareaRef}
          className={styles.postTextarea}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            adjustHeight()
            const mq = getMentionQuery(e.target.value, e.target.selectionStart)
            setMentionQuery(mq)
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
      </div>
      <div className={styles.postActions}>
        <EmojiButton
          onSelect={(emoji) => {
            setText((prev) => prev + emoji)
            adjustHeight()
          }}
        />
        <TokenEmbedPicker
          onSelect={(embed) =>
            setPendingEmbeds((prev) =>
              prev.some((e) => e.tokenId === embed.tokenId)
                ? prev
                : [...prev, embed]
            )
          }
          embedCount={pendingEmbeds.length}
        />
        <Button
          shadow_box
          selected={storageMode === 'ipfs'}
          onClick={() =>
            setStorageMode(storageMode === 'onchain' ? 'ipfs' : 'onchain')
          }
          title={
            storageMode === 'ipfs'
              ? 'IPFS storage (lower cost)'
              : 'On-chain storage (permanent, higher cost)'
          }
        >
          {storageMode === 'ipfs' ? 'IPFS' : 'On-chain'}
        </Button>
        <Button
          shadow_box
          onClick={handleSubmit}
          disabled={sending || (!text.trim() && pendingEmbeds.length === 0)}
        >
          {sending ? '...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
