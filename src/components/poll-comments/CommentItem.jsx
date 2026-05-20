import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import {
  editComment,
  setOwnCommentHidden,
} from '@data/messaging/poll-comments-actions'
import { useCommentHistory } from '@data/messaging/poll-comments'
import styles from './index.module.scss'

export default function CommentItem({
  comment,
  replies,
  viewer,
  senderAlias,
  senderLogo,
  parent,
  parentAlias,
  onReply,
  renderReply,
}) {
  const isOwn = viewer && comment.sender === viewer
  const isEdited = comment.version > 1
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [busy, setBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const menuRef = useRef(null)
  const { data: history, isLoading: historyLoading } = useCommentHistory(
    historyOpen ? comment.id : undefined,
    comment.version
  )

  // Close the actions menu when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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
        parentId: comment.parentId ?? undefined,
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

  const canShowMenu = !editing && (isOwn || (viewer && onReply) || isEdited)

  return (
    <>
      <div id={`comment-${comment.id}`} className={styles.comment}>
        <Identicon
          address={comment.sender}
          logo={senderLogo}
          className={styles.avatar}
        />
        <div className={styles.body}>
          <div className={styles.head}>
            <Link to={`/tz/${comment.sender}`} className={styles.sender}>
              {senderAlias || walletPreview(comment.sender)}
            </Link>
            <span className={styles.time}>
              {getTimeAgo(comment.timestamp)}
              {isEdited && <span className={styles.edited}> · edited</span>}
            </span>
            {canShowMenu && (
              <div className={styles.menuWrapper} ref={menuRef}>
                <button
                  type="button"
                  className={styles.menuToggle}
                  aria-label="Comment actions"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  ⋯
                </button>
                {menuOpen && (
                  <div className={styles.menuPopover}>
                    {viewer && onReply && (
                      <button
                        className={styles.menuItem}
                        onClick={() => {
                          setMenuOpen(false)
                          onReply(comment)
                        }}
                      >
                        Reply
                      </button>
                    )}
                    {isOwn && (
                      <>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            setMenuOpen(false)
                            setEditing(true)
                          }}
                          disabled={busy}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            setMenuOpen(false)
                            handleHide()
                          }}
                          disabled={busy}
                        >
                          Hide
                        </button>
                      </>
                    )}
                    {isEdited && (
                      <button
                        className={styles.menuItem}
                        onClick={() => {
                          setMenuOpen(false)
                          setHistoryOpen((o) => !o)
                        }}
                      >
                        {historyOpen ? 'Hide history' : 'History'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
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
                <button
                  className={styles.menuItem}
                  onClick={handleEditSave}
                  disabled={busy}
                >
                  {busy ? 'Saving...' : 'Save'}
                </button>
                <button
                  className={styles.menuItem}
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

          {historyOpen && isEdited && (
            <div className={styles.history}>
              <div className={styles.historyHeader}>Edit history</div>
              {historyLoading && (
                <div className={styles.historyEmpty}>Loading history...</div>
              )}
              {!historyLoading && (!history || history.length === 0) && (
                <div className={styles.historyEmpty}>
                  No archived versions found.
                </div>
              )}
              {history?.map((v) => (
                <div key={v.version} className={styles.historyItem}>
                  <div className={styles.historyMeta}>
                    v{v.version} · {getTimeAgo(v.timestamp)}
                  </div>
                  <div className={styles.historyContent}>{v.content}</div>
                </div>
              ))}
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
