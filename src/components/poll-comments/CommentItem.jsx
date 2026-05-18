import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import {
  editComment,
  setOwnCommentHidden,
} from '@data/messaging/poll-comments-actions'
import styles from './index.module.scss'

export default function CommentItem({
  comment,
  replies,
  viewer,
  senderAlias,
  parent,
  parentAlias,
  onReply,
  renderReply,
}) {
  const isOwn = viewer && comment.sender === viewer
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [busy, setBusy] = useState(false)

  const scrollToParent = () => {
    if (!comment.parentId) return
    const el = document.getElementById(`comment-${comment.parentId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleEditSave = useCallback(async () => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === comment.content || busy) return
    setBusy(true)
    try {
      await editComment({
        commentId: comment.id,
        pollId: comment.pollId,
        content: trimmed,
      })
      setEditing(false)
    } catch (e) {
      console.error('Edit failed:', e)
    } finally {
      setBusy(false)
    }
  }, [editText, comment, busy])

  const handleHide = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      await setOwnCommentHidden({
        commentId: comment.id,
        pollId: comment.pollId,
        hidden: true,
      })
    } catch (e) {
      console.error('Hide failed:', e)
    } finally {
      setBusy(false)
    }
  }, [comment, busy])

  return (
    <>
      <div id={`comment-${comment.id}`} className={styles.comment}>
        <Identicon address={comment.sender} className={styles.avatar} />
        <div className={styles.body}>
          <div className={styles.head}>
            <Link to={`/tz/${comment.sender}`} className={styles.sender}>
              {senderAlias || walletPreview(comment.sender)}
            </Link>
            {comment.isIpfs && <span className={styles.ipfsBadge}>IPFS</span>}
            <span className={styles.time}>{getTimeAgo(comment.timestamp)}</span>
          </div>

          {parent && (
            <button className={styles.replyTo} onClick={scrollToParent}>
              ↩ {parentAlias || walletPreview(parent.sender)}:{' '}
              {parent.content.length > 60
                ? parent.content.slice(0, 60) + '...'
                : parent.content}
            </button>
          )}

          {editing ? (
            <div className={styles.editArea}>
              <textarea
                className={styles.textarea}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                disabled={busy}
                rows={3}
              />
              <div className={styles.editActions}>
                <button onClick={handleEditSave} disabled={busy}>
                  {busy ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setEditText(comment.content)
                  }}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.content}>{comment.content}</div>
          )}

          {!editing && (
            <div className={styles.actions}>
              {viewer && onReply && (
                <button onClick={() => onReply(comment)}>reply</button>
              )}
              {isOwn && (
                <>
                  <button onClick={() => setEditing(true)} disabled={busy}>
                    edit
                  </button>
                  <button onClick={handleHide} disabled={busy}>
                    hide
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {replies?.length > 0 && (
        <div className={styles.replies}>
          {replies.map((child) => renderReply(child))}
        </div>
      )}
    </>
  )
}
