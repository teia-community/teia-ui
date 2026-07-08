import { useEffect, useMemo, useState } from 'react'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { useChatReadStore } from '@context/chatReadStore'
import { useDaoTokenBalance } from '@data/swr'
import { usePollComments, useIsBanned } from '@data/messaging/poll-comments'
import { useUserProfiles } from '@data/roles'
import { postComment } from '@data/messaging/poll-comments-actions'
import { walletPreview } from '@utils/string'
import { QUIPUSWAP_TEIA_URL } from '@constants'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'
import styles from './index.module.scss'

/**
 * Filter hidden comments and any reply subtree rooted under a hidden
 * comment, then build {byId, children, roots} for rendering.
 */
function buildTree(comments) {
  const visible = []
  const hiddenIds = new Set()
  for (const c of comments) {
    if (c.hidden) hiddenIds.add(c.id)
  }
  for (const c of comments) {
    if (c.hidden) continue
    if (c.parentId && hiddenIds.has(c.parentId)) {
      hiddenIds.add(c.id)
      continue
    }
    visible.push(c)
  }

  const byId = {}
  const children = {}
  for (const c of visible) byId[c.id] = c
  for (const c of visible) {
    if (c.parentId && byId[c.parentId]) {
      if (!children[c.parentId]) children[c.parentId] = []
      children[c.parentId].push(c)
    }
  }
  const roots = visible.filter((c) => !c.parentId || !byId[c.parentId])
  return { byId, children, roots }
}

export default function PollComments({ pollId }) {
  const address = useUserStore((st) => st.address)
  const [replyTo, setReplyTo] = useState(null)

  const { data: comments, isLoading, mutate: refresh } = usePollComments(pollId)
  const [teiaBalance] = useDaoTokenBalance(address)
  const { data: isBanned = false } = useIsBanned(address)
  const markRead = useChatReadStore((st) => st.markRead)

  useEffect(() => {
    if (comments?.length && address) {
      const maxId = Math.max(...comments.map((c) => parseInt(c.id)))
      markRead(address, `poll-comments:${pollId}`, maxId)
    }
  }, [comments, address, pollId, markRead])

  const isHolder = teiaBalance > 0

  const { byId, children, roots } = useMemo(
    () => buildTree(comments ?? []),
    [comments]
  )

  const senderAddrs = useMemo(
    () => Object.values(byId).map((c) => c.sender),
    [byId]
  )
  const { data: profiles = {} } = useUserProfiles(senderAddrs)

  const handlePost = async ({ text }) => {
    await postComment({
      pollId,
      content: text,
      parentId: replyTo?.id,
    })
    refresh()
  }

  const renderComment = (c) => (
    <CommentItem
      key={c.id}
      comment={c}
      replies={children[c.id]}
      viewer={address}
      senderAlias={profiles[c.sender]?.alias || walletPreview(c.sender)}
      senderLogo={profiles[c.sender]?.logo}
      parent={c.parentId ? byId[c.parentId] : null}
      parentAlias={
        c.parentId && byId[c.parentId]
          ? profiles[byId[c.parentId].sender]?.alias ||
            walletPreview(byId[c.parentId].sender)
          : undefined
      }
      onReply={setReplyTo}
      renderReply={renderComment}
    />
  )

  const visibleCount = Object.keys(byId).length
  // Ban check beats the holder check — a banned user with TEIA shouldn't see
  // an enabled form that fails on submit.
  const disabled = !address || isBanned || !isHolder
  const disabledMessage = !address
    ? 'Connect your wallet to comment'
    : isBanned
    ? 'Sorry, you have been banned from commenting.'
    : 'Hold a TEIA token to comment'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Comments</h3>
        <span className={styles.count}>
          {visibleCount} {visibleCount === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      <div className={styles.tip}>
        Join the conversation with a single TEIA.{' '}
        <a href={QUIPUSWAP_TEIA_URL} target="_blank" rel="noreferrer">
          Convert XTZ to TEIA on Quipuswap
        </a>
        .
      </div>

      {isLoading && <Loading message="Loading comments..." />}

      {!isLoading && roots.length === 0 && (
        <div className={styles.empty}>
          No comments yet. Be the first to comment.
        </div>
      )}

      {roots.length > 0 && (
        <div className={styles.thread}>{roots.map(renderComment)}</div>
      )}

      <CommentForm
        onSubmit={handlePost}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={disabled}
        disabledMessage={disabledMessage}
      />
    </div>
  )
}
