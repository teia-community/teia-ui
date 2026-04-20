import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { MESSAGING_MESSAGE_FEE } from '@constants'
import { useUsers } from '@data/swr'
import {
  useChannel,
  useChannelMessages,
  useIsChannelAdmin,
  useChannelAdmins,
} from '@data/messaging/channels'
import { postMessage, deleteMessage } from '@data/messaging/channel-actions'
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
  const { data: channel, isLoading: loadingChannel } = useChannel(channelId)
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
  const messageFee = MESSAGING_MESSAGE_FEE
  const senderAddrs = messages?.map((m) => m.sender) ?? []

  const allMembers = useMemo(() => {
    if (!channel?.creator) return []
    const seen = new Set()
    const out = []
    for (const a of [
      channel.creator,
      ...(admins ?? []),
      ...(channel.allowlist ?? []),
    ]) {
      if (a && !seen.has(a)) {
        seen.add(a)
        out.push(a)
      }
    }
    return out
  }, [channel?.creator, admins, channel?.allowlist])

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
        await deleteMessage(messageId)
        refreshMessages()
      } catch (e) {
        console.error('Delete failed:', e)
      }
    },
    [refreshMessages]
  )

  const handleSubmit = useCallback(
    async ({ text, storageMode, embeds }) => {
      let proof
      if (channel?.accessMode === 'allowlist' && channel?.merkleUri) {
        const result = await computeProofForAddress(channel.merkleUri, address)
        if (!result) {
          throw new Error("You are not in this channel's allowlist")
        }
        proof = result.proof
      }

      await postMessage({
        channelId,
        content: text,
        messageFee,
        proof,
        storageMode,
        parentId: replyTo?.id,
        embeds,
      })
      refreshMessages()
    },
    [channelId, channel, address, messageFee, replyTo, refreshMessages]
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
          <Link to="/messages/channels">Back to channels</Link>
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
            to="/messages/channels"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            ←
          </Link>
          <div className={styles.channelHeaderInfo}>
            {channel.metadata?.image && (
              <img
                src={msgIpfsToUrl(channel.metadata.image)}
                alt=""
                className={styles.channelHeaderImage}
              />
            )}
            <div className={styles.channelHeaderText}>
              <div className={styles.channelHeaderNames}>{channelName}</div>
              <div className={styles.channelHeaderSub}>
                <Link
                  to={`/tz/${channel.creator}`}
                  style={{ color: 'inherit' }}
                >
                  {creatorUser?.alias || walletPreview(channel.creator)}
                </Link>
              </div>
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
                  + Add User
                </Button>
                <Button
                  shadow_box
                  to={`/messages/channels/${channelId}/settings`}
                >
                  Settings
                </Button>
              </>
            )}
          </div>
        </div>
        {addUserOpen && (
          <AddUserModal
            channelId={channelId}
            onClose={() => setAddUserOpen(false)}
          />
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
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={address && msg.sender === address}
                senderAlias={
                  users[msg.sender]?.alias || walletPreview(msg.sender)
                }
                senderLogo={users[msg.sender]?.logo}
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
                  parent
                    ? users[parent.sender]?.alias ||
                      walletPreview(parent.sender)
                    : undefined
                }
                profiles={{}}
              />
            )
          })}
        </div>

        {channel.accessMode === 'members_only' && !isCreator && !isAdmin ? (
          <div style={{ padding: 12, textAlign: 'center', opacity: 0.6 }}>
            Only the channel creator and admins can post in this channel.
          </div>
        ) : (
          <PostForm
            onSubmit={handleSubmit}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={!address}
            disabledMessage="Connect your wallet to post messages"
          />
        )}
      </div>
    </Page>
  )
}
