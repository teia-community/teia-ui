import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { Identicon } from '@atoms/identicons'
import { MESSAGING_MESSAGE_FEE } from '@constants'
import { useUsers } from '@data/swr'
import { useDmMessages } from '@data/messaging/dm'
import { makeRoomKey } from '@data/messaging/dm-types'
import { postDmMessage, deleteDmMessage } from '@data/messaging/dm-actions'
import { useUserStore } from '@context/userStore'
import { useChatReadStore } from '@context/chatReadStore'
import MessageBubble from '@components/chat/MessageBubble'
import PostForm from '@components/chat/PostForm'
import ConvertToChannelModal from './ConvertToChannelModal'
import styles from './index.module.scss'

export default function ConversationView() {
  const { address: peerAddress } = useParams()
  const address = useUserStore((st) => st.address)
  const markRead = useChatReadStore((st) => st.markRead)
  const messageFee = MESSAGING_MESSAGE_FEE
  const [replyTo, setReplyTo] = useState(null)
  const [convertOpen, setConvertOpen] = useState(false)

  const roomKey =
    address && peerAddress ? makeRoomKey(address, peerAddress) : undefined
  const {
    data: messages,
    isLoading,
    mutate: refreshMessages,
    loadMore,
    hasMore,
  } = useDmMessages(roomKey)

  const roomKeyStr = roomKey
    ? `${roomKey.participant_a}:${roomKey.participant_b}`
    : ''

  useEffect(() => {
    if (messages?.length && address && roomKeyStr) {
      const maxId = Math.max(...messages.map((m) => parseInt(m.id)))
      markRead(address, `dm:${roomKeyStr}`, maxId)
    }
  }, [messages, address, roomKeyStr, markRead])

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
        await deleteDmMessage(messageId)
        refreshMessages()
      } catch (e) {
        console.error('Delete failed:', e)
      }
    },
    [refreshMessages]
  )

  const handleSubmit = useCallback(
    async ({ text, storageMode, embeds }) => {
      await postDmMessage({
        recipient: peerAddress,
        content: text,
        messageFee,
        storageMode,
        parentId: replyTo?.id,
        embeds,
      })
      refreshMessages()
    },
    [peerAddress, messageFee, replyTo, refreshMessages]
  )

  const senderAddrs = messages?.map((m) => m.sender) ?? []
  const [users] = useUsers(
    peerAddress ? [peerAddress, ...senderAddrs] : senderAddrs
  )
  const peerUser = peerAddress ? users[peerAddress] : undefined
  const peerName = peerUser?.alias || walletPreview(peerAddress)

  return (
    <Page title={`DM with ${peerName}`}>
      <div className={styles.conversationView}>
        <div className={styles.convHeader}>
          <Link
            to="/messages/dm"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            ←
          </Link>
          {peerAddress && (
            <Identicon
              address={peerAddress}
              logo={peerUser?.logo}
              className={styles.convAvatar}
            />
          )}
          <div>
            <Link
              to={`/tz/${peerAddress}`}
              className={styles.convPeerName}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {peerName}
            </Link>
          </div>
          {address && (
            <div className={styles.convHeaderActions}>
              <Button shadow_box onClick={() => setConvertOpen(true)}>
                + Add User
              </Button>
            </div>
          )}
        </div>
        {convertOpen && (
          <ConvertToChannelModal
            myAddress={address}
            peerAddress={peerAddress}
            onClose={() => setConvertOpen(false)}
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
          {isLoading && <Loading message="Loading messages..." />}
          {!isLoading && (!messages || messages.length === 0) && (
            <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
              No messages yet. Say hello.
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
                  address && msg.sender === address ? handleDelete : undefined
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

        <PostForm
          onSubmit={handleSubmit}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabled={!address}
          disabledMessage="Connect your wallet to send messages"
        />
      </div>
    </Page>
  )
}
