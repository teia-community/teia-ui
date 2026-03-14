import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { bytesToString } from '@taquito/utils'
import { getTimeAgo } from '@utils/time'
import {
  useChannel,
  useChannelMessages,
  useChannelFees,
  useIsChannelAdmin,
  ipfsToUrl,
} from '@data/channels'
import { useUserProfiles } from '@data/swr'
import { postMessage, deleteMessage } from '@data/channel-actions'
import { useShadownetStore } from '@context/shadownetStore'
import { computeProofForAddress } from '@utils/merkle'
import EmojiButton from '@atoms/emoji-picker/EmojiButton'
import MentionText from '@atoms/mention-text/MentionText'
import MentionDropdown from '@atoms/mention-input/MentionDropdown'
import { extractMentionAddresses, getMentionQuery } from '@utils/mentions'
import AccessBadge from './AccessBadge'
import styles from '@style'

function ChannelInfoDialog({ channel, onClose }) {
  const dialogAddrs = [
    ...(channel?.creator ? [channel.creator] : []),
    ...(channel?.allowlist || []),
  ]
  const [dialogProfiles] = useUserProfiles(
    dialogAddrs.length > 0 ? [...new Set(dialogAddrs)] : undefined
  )

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

  const creatorAlias =
    dialogProfiles?.[channel.creator]?.name || walletPreview(channel.creator)

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className={styles.dialogBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Channel Info"
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
          <h3>{channel.metadata?.name || `Channel #${channel.id}`}</h3>
          <button className={styles.dialogClose} onClick={onClose}>
            &times;
          </button>
        </div>

        {channel.metadata?.image && (
          <img
            src={ipfsToUrl(channel.metadata.image)}
            alt=""
            className={styles.dialogImage}
          />
        )}

        {channel.metadata?.description && (
          <p style={{ fontSize: '13px', opacity: 0.8, margin: '0 0 12px' }}>
            {channel.metadata.description}
          </p>
        )}

        <div className={styles.dialogLabel}>Creator</div>
        <div className={styles.dialogRow}>
          <Identicon
            address={channel.creator}
            logo={dialogProfiles?.[channel.creator]?.identicon}
            className={styles.dialogAvatar}
          />
          <Link to={`/tz/${channel.creator}`} style={{ color: 'inherit' }}>
            {creatorAlias}
          </Link>
        </div>

        <div className={styles.dialogLabel} style={{ marginTop: 12 }}>
          Details
        </div>
        <div className={styles.dialogRow}>
          <span>Access: </span>
          <AccessBadge mode={channel.accessMode} />
        </div>
        <div className={styles.dialogRow}>
          Messages: {channel.message_count}
        </div>
        <div className={styles.dialogRow}>
          Created: {new Date(channel.timestamp).toLocaleDateString()}
        </div>

        {channel.accessMode === 'allowlist' &&
          channel.allowlist?.length > 0 && (
            <>
              <div className={styles.dialogLabel} style={{ marginTop: 12 }}>
                Allowlist ({channel.allowlist.length})
              </div>
              {channel.allowlist.map((addr) => (
                <div key={addr} className={styles.dialogRow}>
                  <Identicon
                    address={addr}
                    logo={dialogProfiles?.[addr]?.identicon}
                    className={styles.dialogAvatar}
                  />
                  <Link
                    to={`/tz/${addr}`}
                    style={{
                      fontSize: '12px',
                      wordBreak: 'break-all',
                      color: 'inherit',
                    }}
                  >
                    {dialogProfiles?.[addr]?.name || addr}
                  </Link>
                </div>
              ))}
            </>
          )}
      </div>
    </div>
  )
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
              ? `↩ ${
                  parentAlias || walletPreview(parentMsg.sender)
                }: "${parentPreview}"`
              : `↩ replying to #${msg.parent_id}`}
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

function PostForm({ channelId, channel, onPosted, replyTo, onCancelReply }) {
  const address = useShadownetStore((st) => st.address)
  const { messageFee } = useChannelFees()
  const [text, setText] = useState('')
  const [storageMode, setStorageMode] = useState('ipfs')
  const [sending, setSending] = useState(false)
  const [proofError, setProofError] = useState(null)
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
    setProofError(null)

    try {
      let proof = undefined

      if (channel.accessMode === 'allowlist' && channel.merkle_uri) {
        const decodedMerkleUri = bytesToString(channel.merkle_uri)
        const merkleUri = decodedMerkleUri.startsWith('ipfs://')
          ? decodedMerkleUri
          : null

        if (merkleUri) {
          const result = await computeProofForAddress(merkleUri, address)
          if (!result) {
            setProofError("You are not in this channel's allowlist")
            setSending(false)
            return
          }
          proof = result.proof
        }
      }

      await postMessage({
        channelId,
        content: text.trim(),
        messageFee,
        proof,
        storageMode,
        parentId: replyTo?.id,
      })
      setText('')
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
    channelId,
    channel,
    address,
    messageFee,
    storageMode,
    replyTo,
    onCancelReply,
    onPosted,
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
      {proofError && <div className={styles.notAllowed}>{proofError}</div>}
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

export default function ChannelView() {
  const { id } = useParams()
  const channelId = id ? parseInt(id) : undefined
  const [showInfo, setShowInfo] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const { data: channel, isLoading: loadingChannel } = useChannel(channelId)
  const {
    data: messages,
    isLoading: loadingMessages,
    mutate: refreshMessages,
  } = useChannelMessages(channelId)
  const address = useShadownetStore((st) => st.address)
  const { data: isAdmin } = useIsChannelAdmin(channelId, address)

  // Resolve sender + creator + allowlist + mention aliases and identicons
  const mentionAddrs = messages
    ? messages.flatMap((m) => extractMentionAddresses(m.content))
    : []
  const profileAddrs = [
    ...(messages ? messages.map((m) => m.sender) : []),
    ...(channel?.creator ? [channel.creator] : []),
    ...(channel?.allowlist || []),
    ...mentionAddrs,
  ]
  const uniqueAddrs =
    profileAddrs.length > 0 ? [...new Set(profileAddrs)] : undefined
  const [profiles] = useUserProfiles(uniqueAddrs)

  // Build a lookup map for parent message resolution
  const msgById = {}
  if (messages) {
    for (const m of messages) msgById[m.id] = m
  }

  const handleDelete = useCallback(
    async (messageId) => {
      try {
        await deleteMessage(messageId)
        refreshMessages()
      } catch (e) {
        console.error('Delete failed:', e)
      }
    },
    [refreshMessages]
  )

  if (loadingChannel) {
    return (
      <Page title="Channel">
        <Loading message="Loading channel..." />
      </Page>
    )
  }

  if (!channel) {
    return (
      <Page title="Channel not found">
        <div className={styles.empty}>
          <p>Channel not found.</p>
          <Button to="/testnet/channels">Back to channels</Button>
        </div>
      </Page>
    )
  }

  const isCreator = address && address === channel.creator
  const channelName = channel.metadata?.name || `Channel #${channelId}`

  // Participants: allowlist addresses for allowlist channels, unique senders otherwise
  const participants =
    channel.accessMode === 'allowlist' && channel.allowlist?.length > 0
      ? channel.allowlist
      : messages
      ? [...new Set(messages.map((m) => m.sender))]
      : []
  const MAX_AVATARS = 3
  const MAX_NAMES = 2
  const displayAvatars = participants.slice(0, MAX_AVATARS)
  const displayNames = participants
    .slice(0, MAX_NAMES)
    .map((addr) => profiles?.[addr]?.name || walletPreview(addr))
  const remaining = participants.length - MAX_NAMES

  return (
    <Page title={channelName}>
      <div className={styles.channelView}>
        <div className={styles.channelHeader}>
          <Link
            to="/testnet/channels"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            ←
          </Link>
          <div className={styles.channelHeaderInfo}>
            {channel.metadata?.image && (
              <img
                src={ipfsToUrl(channel.metadata.image)}
                alt=""
                className={styles.channelHeaderImage}
              />
            )}
            <div>
              <div className={styles.channelHeaderNames}>{channelName}</div>
              <div className={styles.channelHeaderSub}>
                {channel.message_count} messages ·{' '}
                <Link
                  to={`/tz/${channel.creator}`}
                  style={{ color: 'inherit' }}
                >
                  {profiles?.[channel.creator]?.name ||
                    walletPreview(channel.creator)}
                </Link>
              </div>
              {participants.length > 0 && (
                <div className={styles.channelParticipants}>
                  <div className={styles.stackedAvatars}>
                    {displayAvatars.map((addr) => (
                      <Identicon
                        key={addr}
                        address={addr}
                        logo={profiles?.[addr]?.identicon}
                      />
                    ))}
                  </div>
                  <span className={styles.participantNames}>
                    {displayNames.join(', ')}
                    {remaining > 0 && ` +${remaining}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={styles.channelHeaderActions}>
            <AccessBadge mode={channel.accessMode} />
            <Button shadow_box onClick={() => setShowInfo(true)}>
              Info
            </Button>
            {(isCreator || isAdmin) && (
              <Button shadow_box to={`/testnet/channels/${channelId}/settings`}>
                Settings
              </Button>
            )}
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
                onDelete={
                  address &&
                  (msg.sender === address ||
                    channel.creator === address ||
                    isAdmin)
                    ? handleDelete
                    : undefined
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
          channelId={channelId}
          channel={channel}
          onPosted={refreshMessages}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />

        {showInfo && (
          <ChannelInfoDialog
            channel={channel}
            onClose={() => setShowInfo(false)}
          />
        )}
      </div>
    </Page>
  )
}
