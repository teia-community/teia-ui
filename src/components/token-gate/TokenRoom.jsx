import { useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { CIDToURL } from '@utils/index'
import {
  useTokenRoomMessages,
  useTokenGateFees,
  useFA2Tokens,
} from '@data/token-gate'
import {
  postTokenGateMessage,
  deleteTokenGateMessage,
} from '@data/token-gate-actions'
import { useUserProfiles } from '@data/swr'
import { useShadownetStore } from '@context/shadownetStore'
import EmojiButton from '@atoms/emoji-picker/EmojiButton'
import MentionText from '@atoms/mention-text/MentionText'
import MentionDropdown from '@atoms/mention-input/MentionDropdown'
import { extractMentionAddresses, getMentionQuery } from '@utils/mentions'
import styles from './index.module.scss'

function ipfsToUrl(uri) {
  if (!uri) return null
  const cid = uri.replace('ipfs://', '')
  return CIDToURL(cid, 'IPFS', { size: 'raw' })
}

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

function PostForm({ fa2Address, tokenId, onPosted, replyTo, onCancelReply }) {
  const address = useShadownetStore((st) => st.address)
  const { messageFee } = useTokenGateFees()
  const [text, setText] = useState('')
  const [storageMode, setStorageMode] = useState('onchain')
  const [sending, setSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const textareaRef = useRef(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || sending) return
    setSending(true)

    try {
      await postTokenGateMessage({
        fa2Address,
        tokenId: parseInt(tokenId),
        content: text.trim(),
        messageFee,
        storageMode,
        parentId: replyTo?.id,
      })
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
    fa2Address,
    tokenId,
    messageFee,
    storageMode,
    replyTo,
    onCancelReply,
    onPosted,
  ])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
          disabled={sending || !text.trim()}
        >
          {sending ? '...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}

export default function TokenRoom() {
  const { fa2Address, tokenId } = useParams()
  const [replyTo, setReplyTo] = useState(null)
  const address = useShadownetStore((st) => st.address)

  const {
    data: messages,
    isLoading: loadingMessages,
    mutate: refreshMessages,
  } = useTokenRoomMessages(fa2Address, tokenId)

  // Fetch token metadata
  const { data: tokens } = useFA2Tokens(fa2Address)
  const token = tokens?.find((t) => t.tokenId === tokenId)
  const tokenName = token?.metadata?.name || `Token #${tokenId}`
  const tokenImgUrl = ipfsToUrl(
    token?.metadata?.thumbnailUri ||
      token?.metadata?.displayUri ||
      token?.metadata?.artifactUri
  )

  // Resolve profiles for message senders + mentioned addresses
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
    return (
      <Page title={tokenName}>
        <Loading message="Loading room..." />
      </Page>
    )
  }

  return (
    <Page title={tokenName}>
      <div className={styles.roomView}>
        <div className={styles.roomHeader}>
          <Link
            to="/testnet/token-chat"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            &larr;
          </Link>
          {tokenImgUrl ? (
            <img src={tokenImgUrl} alt="" className={styles.roomHeaderImage} />
          ) : (
            <div className={styles.roomHeaderImagePlaceholder}>#</div>
          )}
          <div className={styles.roomHeaderInfo}>
            <div className={styles.roomHeaderName}>{tokenName}</div>
            <div className={styles.roomHeaderSub}>
              #{tokenId} · {walletPreview(fa2Address)} · {messages?.length || 0}{' '}
              messages
            </div>
          </div>
        </div>

        <div className={styles.messages}>
          {loadingMessages && <Loading message="Loading messages..." />}
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
                isIpfs={msg.isIpfs}
                onReply={address ? setReplyTo : undefined}
                onDelete={
                  address && msg.sender === address ? handleDelete : undefined
                }
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
          fa2Address={fa2Address}
          tokenId={tokenId}
          onPosted={refreshMessages}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </Page>
  )
}
