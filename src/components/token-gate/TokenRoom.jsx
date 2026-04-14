import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { useUsers } from '@data/swr'
import {
  useTokenRoomMessages,
  useTokenGateFees,
} from '@data/messaging/token-gate'
import {
  postTokenGateMessage,
  deleteTokenGateMessage,
} from '@data/messaging/token-gate-actions'
import { useUserStore } from '@context/userStore'
import MessageBubble from '@components/chat/MessageBubble'
import PostForm from '@components/chat/PostForm'
import styles from './index.module.scss'

export default function TokenRoom({ fa2Override, tokenIdOverride }) {
  const params = useParams()
  const fa2Address = fa2Override || params.fa2Address
  const tokenId = tokenIdOverride || params.tokenId
  const address = useUserStore((st) => st.address)
  const { messageFee } = useTokenGateFees()
  const [replyTo, setReplyTo] = useState(null)

  const {
    data: messages,
    isLoading,
    mutate: refreshMessages,
    loadMore,
    hasMore,
  } = useTokenRoomMessages(fa2Address, tokenId)
  const [users] = useUsers(messages?.map((m) => m.sender) ?? [])

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

  const handleSubmit = useCallback(
    async ({ text, storageMode, embeds }) => {
      await postTokenGateMessage({
        fa2Address,
        tokenId,
        content: text,
        messageFee,
        storageMode,
        parentId: replyTo?.id,
        embeds,
      })
      refreshMessages()
    },
    [fa2Address, tokenId, messageFee, replyTo, refreshMessages]
  )

  const title = `Token Chat: ${walletPreview(fa2Address)} #${tokenId}`

  return (
    <Page title={title}>
      <div className={styles.tokenRoom}>
        <div className={styles.tokenHeader}>
          <Link
            to="/messages/token-chat"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            ←
          </Link>
          <div>
            <div className={styles.tokenTitle}>Token #{tokenId}</div>
            <div className={styles.tokenSub}>{walletPreview(fa2Address)}</div>
          </div>
        </div>

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
              No messages yet. Only token holders can post.
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
          disabled
          disabledMessage="Token-gated chat is deactivated for now."
        />
      </div>
    </Page>
  )
}
