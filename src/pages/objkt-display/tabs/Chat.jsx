import { useState, useCallback, useRef, useEffect } from 'react'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useTokenRoomMessages } from '@data/messaging/token-gate'
import {
  postTokenGateMessage,
  deleteTokenGateMessage,
} from '@data/messaging/token-gate-actions'
import { useUserProfiles } from '@data/swr'
import { useShadownetStore } from '@context/shadownetStore'
import { useChatReadStore } from '@context/chatReadStore'
import EmojiButton from '@atoms/emoji-picker/EmojiButton'
import MentionText from '@atoms/mention-text/MentionText'
import MentionDropdown from '@atoms/mention-input/MentionDropdown'
import { extractMentionAddresses, getMentionQuery } from '@utils/mentions'
import { useObjktDisplayContext } from '../index.tsx'
import styles from './chat.module.scss'

function MessageBubble({
  msg,
  isOwn,
  senderAlias,
  senderLogo,
  onDelete,
  onReply,
  parentMsg,
  parentAlias,
  profiles,
}) {
  const displayTime = msg.payload?.timestamp
    ? getTimeAgo(msg.payload.timestamp)
    : getTimeAgo(msg.timestamp)

  return (
    <div className={`${styles.bubble} ${isOwn ? styles.own : ''}`}>
      <div className={styles.bubbleHeader}>
        <Identicon
          address={msg.sender}
          logo={senderLogo}
          className={styles.avatar}
        />
        <span className={styles.senderName}>
          {senderAlias || walletPreview(msg.sender)}
        </span>
        <span className={styles.msgTime}>{displayTime}</span>
        <div className={styles.msgActions}>
          {onReply && (
            <button className={styles.actionBtn} onClick={() => onReply(msg)}>
              reply
            </button>
          )}
          {onDelete && (
            <button
              className={styles.actionBtn}
              onClick={() => onDelete(msg.id)}
            >
              delete
            </button>
          )}
        </div>
      </div>
      {parentMsg && (
        <div className={styles.replyContext}>
          replying to {parentAlias || walletPreview(parentMsg.sender)}:{' '}
          {parentMsg.content?.slice(0, 80)}
        </div>
      )}
      <div className={styles.msgContent}>
        <MentionText text={msg.content} profiles={profiles} />
      </div>
    </div>
  )
}

function PostForm({ fa2Address, tokenId, onPosted, replyTo, onCancelReply }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const inputRef = useRef(null)

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await postTokenGateMessage({
        fa2Address,
        tokenId: parseInt(tokenId),
        content: text.trim(),
        parentId: replyTo?.id || null,
      })
      setText('')
      if (onCancelReply) onCancelReply()
      onPosted()
    } catch (e) {
      console.error('Send failed:', e)
    } finally {
      setSending(false)
    }
  }, [text, sending, fa2Address, tokenId, replyTo, onPosted, onCancelReply])

  const handleInput = (e) => {
    const val = e.target.value
    setText(val)
    setMentionQuery(getMentionQuery(val, e.target.selectionStart))
  }

  const handleMentionSelect = (addr) => {
    const pos = inputRef.current?.selectionStart || text.length
    const before = text.slice(0, pos)
    const atIdx = before.lastIndexOf('@')
    if (atIdx >= 0) {
      setText(before.slice(0, atIdx) + `@${addr} ` + text.slice(pos))
    }
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  return (
    <div className={styles.postForm}>
      {replyTo && (
        <div className={styles.replyBanner}>
          Replying to {walletPreview(replyTo.sender)}
          <button onClick={onCancelReply} className={styles.actionBtn}>
            cancel
          </button>
        </div>
      )}
      <div className={styles.inputRow}>
        <div className={styles.inputWrap}>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            value={text}
            onChange={handleInput}
            placeholder="Write a message..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          {mentionQuery && (
            <MentionDropdown
              query={mentionQuery}
              onSelect={handleMentionSelect}
            />
          )}
        </div>
        <EmojiButton onSelect={(emoji) => setText((t) => t + emoji)} />
        <Button
          shadow_box
          onClick={handleSubmit}
          disabled={sending || !text.trim()}
        >
          {sending ? '...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}

export function Chat() {
  const { nft } = useObjktDisplayContext()
  const fa2Address = nft?.fa2_address
  const tokenId = nft?.token_id
  const [replyTo, setReplyTo] = useState(null)
  const address = useShadownetStore((st) => st.address)

  const {
    data: messages,
    isLoading: loadingMessages,
    mutate: refreshMessages,
  } = useTokenRoomMessages(fa2Address, tokenId)
  const markRead = useChatReadStore((st) => st.markRead)

  useEffect(() => {
    if (messages?.length && address && fa2Address && tokenId) {
      const maxId = Math.max(...messages.map((m) => m.id))
      markRead(address, `token:${fa2Address}:${tokenId}`, maxId)
    }
  }, [messages, address, fa2Address, tokenId, markRead])

  const senderAddrs = messages
    ? [...new Set(messages.map((m) => m.sender))]
    : []
  const mentionAddrs = messages
    ? messages.flatMap((m) => extractMentionAddresses(m.content))
    : []
  const allProfileAddrs = [...new Set([...senderAddrs, ...mentionAddrs])]
  const [profiles] = useUserProfiles(
    allProfileAddrs.length > 0 ? allProfileAddrs : undefined
  )

  const msgById = {}
  if (messages) {
    for (const m of messages) msgById[m.id] = m
  }

  const handleDelete = useCallback(
    async (messageId) => {
      try {
        await deleteTokenGateMessage(messageId)
        refreshMessages()
      } catch (e) {
        console.error('Delete failed:', e)
      }
    },
    [refreshMessages]
  )

  if (loadingMessages && !messages) {
    return <Loading message="Loading chat..." />
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {!loadingMessages && (!messages || messages.length === 0) && (
          <div className={styles.empty}>
            No messages yet. Be the first to chat about this token.
          </div>
        )}
        {messages?.map((msg) => {
          const parent = msg.parent_id ? msgById[msg.parent_id] : null
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={address && msg.sender === address}
              senderAlias={profiles?.[msg.sender]?.name}
              senderLogo={profiles?.[msg.sender]?.identicon}
              onReply={address ? setReplyTo : undefined}
              onDelete={
                address && msg.sender === address ? handleDelete : undefined
              }
              parentMsg={parent}
              parentAlias={parent ? profiles?.[parent.sender]?.name : undefined}
              profiles={profiles}
            />
          )
        })}
      </div>

      {address && (
        <PostForm
          fa2Address={fa2Address}
          tokenId={tokenId}
          onPosted={refreshMessages}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
    </div>
  )
}
