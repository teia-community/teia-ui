import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useDmMessages, useDmFees } from '@data/messaging/dm'
import { makeRoomKey, roomKeyToString } from '@data/messaging/dm-types'
import { postDmMessage, deleteDmMessage } from '@data/messaging/dm-actions'
import { useUserProfiles } from '@data/swr'
import { useShadownetStore } from '@context/shadownetStore'
import { useChatReadStore } from '@context/chatReadStore'
import EmojiButton from '@atoms/emoji-picker/EmojiButton'
import TokenEmbedPicker from '@atoms/token-embed-picker/TokenEmbedPicker'
import TokenEmbedCard from '@atoms/token-embed-card/TokenEmbedCard'
import MentionText from '@atoms/mention-text/MentionText'
import MentionDropdown from '@atoms/mention-input/MentionDropdown'
import { extractMentionAddresses, getMentionQuery } from '@utils/mentions'
import styles from '@style'

function MessageBubble({
  msg,
  isOwn,
  senderAlias,
  senderLogo,
  onDelete,
  onReply,
  isIpfs,
  parentMsg,
  parentAlias,
  profiles,
}) {
  const displayTime = msg.payload?.timestamp
    ? getTimeAgo(msg.payload.timestamp)
    : getTimeAgo(msg.timestamp)

  const scrollToParent = () => {
    if (!msg.parent_id) return
    const el = document.getElementById(`msg-${msg.parent_id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add(styles.bubbleHighlight)
      setTimeout(() => el.classList.remove(styles.bubbleHighlight), 1500)
    }
  }

  const parentPreview = parentMsg
    ? parentMsg.content.length > 60
      ? parentMsg.content.slice(0, 60) + '...'
      : parentMsg.content
    : null

  return (
    <div
      id={`msg-${msg.id}`}
      className={`${styles.bubbleRow} ${isOwn ? styles.bubbleRowOwn : ''}`}
    >
      {!isOwn && (
        <Identicon
          address={msg.sender}
          logo={senderLogo}
          className={styles.bubbleAvatar}
        />
      )}
      <div>
        {!isOwn && (
          <div className={styles.bubbleSender}>
            {senderAlias || walletPreview(msg.sender)}
          </div>
        )}
        {msg.parent_id && (
          <button className={styles.replyIndicator} onClick={scrollToParent}>
            {parentMsg
              ? `\u21a9 ${
                  parentAlias || walletPreview(parentMsg.sender)
                }: "${parentPreview}"`
              : `\u21a9 replying to #${msg.parent_id}`}
          </button>
        )}
        <div
          className={`${styles.bubble} ${
            isOwn ? styles.bubbleOwn : styles.bubbleOther
          }`}
        >
          <MentionText content={msg.content} profiles={profiles} />
          {msg.payload?.embeds?.map((embed, i) => (
            <TokenEmbedCard key={i} embed={embed} />
          ))}
        </div>
        <div className={styles.bubbleMeta}>
          {isIpfs && <span className={styles.bubbleIpfsBadge}>IPFS</span>}
          <span>{displayTime}</span>
          {onReply && (
            <button className={styles.bubbleReply} onClick={() => onReply(msg)}>
              reply
            </button>
          )}
          {onDelete && (
            <button
              className={styles.bubbleDelete}
              onClick={() => onDelete(msg.id)}
            >
              delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RoomInfoDialog({ peer, profiles, onClose }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const peerAlias = profiles?.[peer]?.name || walletPreview(peer)

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className={styles.dialogBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Room Info"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={styles.dialog}
        role="document"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogHeader}>
          <h3>Conversation with {peerAlias}</h3>
          <button className={styles.dialogClose} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.dialogLabel}>Peer</div>
        <div className={styles.dialogRow}>
          <Identicon
            address={peer}
            logo={profiles?.[peer]?.identicon}
            className={styles.dialogAvatar}
          />
          <Link to={`/tz/${peer}`} style={{ color: 'inherit' }}>
            {peerAlias}
          </Link>
        </div>
      </div>
    </div>
  )
}

function PostForm({ recipient, onPosted, replyTo, onCancelReply }) {
  const address = useShadownetStore((st) => st.address)
  const { messageFee } = useDmFees()
  const [text, setText] = useState('')
  const [storageMode, setStorageMode] = useState('onchain')
  const [sending, setSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const [pendingEmbeds, setPendingEmbeds] = useState([])
  const textareaRef = useRef(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if ((!text.trim() && pendingEmbeds.length === 0) || sending) return
    setSending(true)

    try {
      await postDmMessage({
        recipient,
        content: text.trim(),
        messageFee,
        storageMode,
        parentId: replyTo?.id,
        embeds: pendingEmbeds.length > 0 ? pendingEmbeds : undefined,
      })
      setText('')
      setPendingEmbeds([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      if (onCancelReply) onCancelReply()
      if (onPosted) onPosted()
    } catch (e) {
      console.error('Post failed:', e)
    } finally {
      setSending(false)
    }
  }, [
    text,
    sending,
    recipient,
    messageFee,
    storageMode,
    replyTo,
    onCancelReply,
    onPosted,
    pendingEmbeds,
  ])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (mentionQuery) return
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!address) {
    return (
      <div className={styles.notAllowed}>
        Connect your Shadownet wallet to post messages
      </div>
    )
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
              key={embed.tokenId}
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
              ? 'Using IPFS storage (lower cost)'
              : 'Using on-chain storage'
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

export default function ConversationView() {
  const { address: peerAddress } = useParams()
  const [replyTo, setReplyTo] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const address = useShadownetStore((st) => st.address)

  const roomKey =
    address && peerAddress ? makeRoomKey(address, peerAddress) : undefined
  const roomKeyStr = roomKey ? roomKeyToString(roomKey) : undefined

  const {
    data: messages,
    isLoading: loadingMessages,
    mutate: refreshMessages,
  } = useDmMessages(roomKey)
  const markRead = useChatReadStore((st) => st.markRead)

  useEffect(() => {
    if (messages?.length && address && roomKeyStr) {
      const maxId = Math.max(...messages.map((m) => m.id))
      markRead(address, `dm:${roomKeyStr}`, maxId)
    }
  }, [messages, address, roomKeyStr, markRead])

  // Resolve profiles for peer + mentioned addresses
  const mentionAddrs = messages
    ? messages.flatMap((m) => extractMentionAddresses(m.content))
    : []
  const allAddrs =
    peerAddress || mentionAddrs.length > 0
      ? [
          ...new Set([
            ...(peerAddress ? [peerAddress] : []),
            ...(address ? [address] : []),
            ...mentionAddrs,
          ]),
        ]
      : undefined
  const [profiles] = useUserProfiles(allAddrs)

  // Build lookup map for parent message resolution
  const msgById = {}
  if (messages) {
    for (const m of messages) msgById[m.id] = m
  }

  const handleDelete = useCallback(
    async (messageId) => {
      try {
        await deleteDmMessage(messageId)
        refreshMessages()
      } catch (e) {
        console.error('Delete failed:', e)
      }
    },
    [refreshMessages]
  )

  const peerAlias =
    profiles?.[peerAddress]?.name || walletPreview(peerAddress || '')

  if (loadingMessages && !messages) {
    return (
      <Page title="Conversation">
        <Loading message="Loading conversation..." />
      </Page>
    )
  }

  return (
    <Page title={peerAlias}>
      <div className={styles.conversationView}>
        <div className={styles.convHeader}>
          <Link
            to="/messages/dm"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            &larr;
          </Link>
          <div className={styles.convHeaderInfo}>
            <div className={styles.convHeaderName}>{peerAlias}</div>
            <div className={styles.convParticipants}>
              <div className={styles.convStackedAvatars}>
                <Identicon
                  address={peerAddress}
                  logo={profiles?.[peerAddress]?.identicon}
                />
              </div>
            </div>
          </div>
          <div className={styles.convHeaderActions}>
            <Button shadow_box onClick={() => setShowInfo(true)}>
              Info
            </Button>
          </div>
        </div>

        <div className={styles.messages}>
          {loadingMessages && <Loading message="Loading messages..." />}
          {!loadingMessages && (!messages || messages.length === 0) && (
            <div className={styles.empty}>
              No messages yet. Start the conversation.
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
                isIpfs={msg.isIpfs}
                onReply={address ? setReplyTo : undefined}
                onDelete={address ? handleDelete : undefined}
                parentMsg={parent}
                parentAlias={
                  parent ? profiles?.[parent.sender]?.name : undefined
                }
                profiles={profiles}
              />
            )
          })}
        </div>

        <PostForm
          recipient={peerAddress}
          onPosted={refreshMessages}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />

        {showInfo && peerAddress && (
          <RoomInfoDialog
            peer={peerAddress}
            profiles={profiles}
            onClose={() => setShowInfo(false)}
          />
        )}
      </div>
    </Page>
  )
}
