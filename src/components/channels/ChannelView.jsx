import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { useUsers } from '@data/swr'
import {
  useChannel,
  useChannelMessages,
  useIsChannelAdmin,
  useChannelAdmins,
} from '@data/messaging/channels'
import {
  postMessage,
  editMessage,
  deleteMessage,
  setOwnMessageHidden,
  moderateMessageHidden,
} from '@data/messaging/channel-actions'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { computeProofForAddress } from '@utils/merkle'
import { useUserStore } from '@context/userStore'
import { useChatReadStore } from '@context/chatReadStore'
import MessageBubble from '@components/chat/MessageBubble'
import PostForm from '@components/chat/PostForm'
import AccessBadge from './AccessBadge'
import AddUserModal from './AddUserModal'
import styles from './index.module.scss'

export default function ChannelView() {
  const { id } = useParams()
  const channelId = id || undefined
  const [replyTo, setReplyTo] = useState(null)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const {
    data: channel,
    isLoading: loadingChannel,
    mutate: refreshChannel,
  } = useChannel(channelId)
  const {
    data: messages,
    isLoading: loadingMessages,
    mutate: refreshMessages,
    loadMore,
    hasMore,
  } = useChannelMessages(channelId)
  const address = useUserStore((st) => st.address)
  const { data: isAdmin } = useIsChannelAdmin(channelId, address)
  const { data: admins } = useChannelAdmins(channelId)
  const senderAddrs = messages?.map((m) => m.sender) ?? []

  const allMembers = useMemo(() => {
    if (!channel?.creator) return []
    const seen = new Set()
    const out = []
    for (const a of [
      channel.creator,
      ...(admins ?? []),
      ...(channel.merkleUsers ?? []),
    ]) {
      if (a && !seen.has(a)) {
        seen.add(a)
        out.push(a)
      }
    }
    return out
  }, [channel?.creator, admins, channel?.merkleUsers])

  const stackAddrs = allMembers.slice(0, 3)
  const extraMemberCount = Math.max(0, allMembers.length - stackAddrs.length)

  const [users] = useUsers(
    channel?.creator
      ? [channel.creator, ...stackAddrs, ...senderAddrs]
      : senderAddrs
  )
  const creatorUser = channel?.creator ? users[channel.creator] : undefined
  const markRead = useChatReadStore((st) => st.markRead)

  useEffect(() => {
    if (messages?.length && address && channelId) {
      const maxId = Math.max(...messages.map((m) => parseInt(m.id)))
      markRead(address, `channel:${channelId}`, maxId)
    }
  }, [messages, address, channelId, markRead])

  const msgById = useMemo(() => {
    const map = {}
    if (messages) {
      for (const m of messages) map[m.id] = m
    }
    return map
  }, [messages])

  const handleDelete = useCallback(
    async (messageId) => {
      try {
        await deleteMessage({ messageId, channelId })
        refreshMessages()
      } catch (e) {
        console.warn('Delete failed:', e)
      }
    },
    [channelId, refreshMessages]
  )

  const handleEdit = useCallback(
    async (messageId, content) => {
      try {
        const msg = msgById[messageId]
        await editMessage({
          messageId,
          channelId,
          content,
          parentId: msg?.parentId,
        })
        refreshMessages()
      } catch (e) {
        console.warn('Edit failed:', e)
      }
    },
    [channelId, msgById, refreshMessages]
  )

  const handleHide = useCallback(
    async (messageId, hidden) => {
      try {
        await setOwnMessageHidden({ messageId, channelId, hidden })
        refreshMessages()
      } catch (e) {
        console.warn('Hide failed:', e)
      }
    },
    [channelId, refreshMessages]
  )

  const handleModerate = useCallback(
    async (messageId, hidden) => {
      try {
        await moderateMessageHidden({ messageId, channelId, hidden })
        refreshMessages()
      } catch (e) {
        console.warn('Moderate failed:', e)
      }
    },
    [channelId, refreshMessages]
  )

  const handleSubmit = useCallback(
    async ({ text, embeds }) => {
      let proof
      const isCreator = address && address === channel?.creator
      if (
        channel?.accessMode === 'allowlist' &&
        channel?.merkleUri &&
        !isCreator &&
        !isAdmin
      ) {
        const result = await computeProofForAddress(channel.merkleUri, address)
        if (!result) {
          throw new Error("You are not in this channel's allowlist")
        }
        proof = result.proof
      }

      await postMessage({
        channelId,
        content: text,
        proof,
        parentId: replyTo?.id,
        embeds,
      })
      refreshMessages()
    },
    [channelId, channel, address, isAdmin, replyTo, refreshMessages]
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
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p>Channel not found.</p>
          <Link to="/inbox">Back to inbox</Link>
        </div>
      </Page>
    )
  }

  const isCreator = address && address === channel.creator
  const channelName = channel.metadata?.name || `Channel #${channelId}`

  return (
    <Page title={channelName}>
      <div className={styles.channelView}>
        <div className={styles.channelHeader}>
          <Link
            to="/inbox"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            ←
          </Link>
          <div className={styles.channelHeaderInfo}>
            {channel.metadata?.image && (
              <button
                type="button"
                className={styles.channelHeaderImageBtn}
                onClick={() => setImageOpen(true)}
              >
                <img
                  src={msgIpfsToUrl(channel.metadata.image)}
                  alt=""
                  className={styles.channelHeaderImage}
                />
              </button>
            )}
            <div className={styles.channelHeaderText}>
              <div className={styles.channelHeaderNames}>{channelName}</div>
              {channel.metadata?.description && (
                <div className={styles.channelHeaderSub}>
                  {channel.metadata.description}
                </div>
              )}
            </div>
          </div>
          {stackAddrs.length > 0 && (
            <div className={styles.walletStack}>
              {stackAddrs.map((addr, i) => (
                <Link
                  key={addr}
                  to={`/tz/${addr}`}
                  className={styles.walletStackItem}
                  style={{ zIndex: stackAddrs.length - i }}
                  title={users[addr]?.alias || walletPreview(addr)}
                >
                  <Identicon address={addr} logo={users[addr]?.logo} />
                </Link>
              ))}
              {extraMemberCount > 0 && (
                <div
                  className={`${styles.walletStackItem} ${styles.walletStackMore}`}
                >
                  +{extraMemberCount}
                </div>
              )}
            </div>
          )}
          <div className={styles.channelHeaderActions}>
            <AccessBadge mode={channel.accessMode} />
            {(isCreator || isAdmin) && (
              <>
                <Button shadow_box onClick={() => setAddUserOpen(true)}>
                  + Add Admin
                </Button>
                <Button shadow_box to={`/inbox/channels/${channelId}/settings`}>
                  Settings
                </Button>
              </>
            )}
          </div>
        </div>
        {addUserOpen && (
          <AddUserModal
            channelId={channelId}
            currentMerkleList={channel.merkleUsers ?? []}
            canAddAdmin={isCreator}
            accessMode={channel.accessMode}
            onClose={() => setAddUserOpen(false)}
            onAdded={() => {
              refreshChannel()
              refreshMessages()
            }}
          />
        )}
        {imageOpen && channel.metadata?.image && (
          <div
            role="button"
            tabIndex={0}
            className={styles.imageOverlay}
            onClick={() => setImageOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter') setImageOpen(false)
            }}
          >
            <img
              src={msgIpfsToUrl(channel.metadata.image)}
              alt={channelName}
              className={styles.imageFull}
            />
          </div>
        )}

        <div className={styles.messages}>
          {hasMore && (
            <div style={{ textAlign: 'center', padding: 8 }}>
              <Button shadow_box onClick={loadMore}>
                Load older messages
              </Button>
            </div>
          )}
          {loadingMessages && <Loading message="Loading messages..." />}
          {!loadingMessages && (!messages || messages.length === 0) && (
            <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
              No messages yet. Start the conversation.
            </div>
          )}
          {messages?.map((msg) => {
            const parent = msg.parentId ? msgById[msg.parentId] : null
            const isOwn = address && msg.sender === address
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={isOwn}
                isAdmin={isCreator || isAdmin}
                senderAlias={users[msg.sender]?.alias}
                senderLogo={users[msg.sender]?.logo}
                onReply={address ? setReplyTo : undefined}
                onEdit={isOwn ? handleEdit : undefined}
                onDelete={isOwn ? handleDelete : undefined}
                onHide={isOwn ? handleHide : undefined}
                onModerate={
                  (isCreator || isAdmin) && !isOwn ? handleModerate : undefined
                }
                parentMsg={parent}
                parentAlias={parent ? users[parent.sender]?.alias : undefined}
                profiles={{}}
              />
            )
          })}
        </div>

        <PostForm
          onSubmit={handleSubmit}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabled={!address}
          disabledMessage="Connect your wallet to post messages"
          submitLabel="Send"
        />
      </div>
    </Page>
  )
}
