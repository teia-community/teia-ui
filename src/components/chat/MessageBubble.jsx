import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import MentionText from '@atoms/mention-text/MentionText'
import TokenEmbedCard from '@atoms/token-embed-card/TokenEmbedCard'
import { useMessageHistory } from '@data/messaging/channels'
import styles from './index.module.scss'

export default function MessageBubble({
  msg,
  isOwn,
  isAdmin,
  senderAlias,
  senderLogo,
  onDelete,
  onReply,
  onEdit,
  onHide,
  onModerate,
  parentMsg,
  parentAlias,
  profiles,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data: history } = useMessageHistory(
    historyOpen ? msg.id : undefined,
    msg.version
  )

  const displayTime = msg.timestamp ? getTimeAgo(msg.timestamp) : ''
  const isEdited = msg.version > 1

  const scrollToParent = () => {
    if (!msg.parentId) return
    const el = document.getElementById(`msg-${msg.parentId}`)
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

  const startEdit = () => {
    setEditText(msg.content)
    setEditing(true)
    setMenuOpen(false)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditText('')
  }

  const submitEdit = () => {
    if (!editText.trim() || editText.trim() === msg.content) {
      cancelEdit()
      return
    }
    onEdit?.(msg.id, editText.trim())
    setEditing(false)
    setEditText('')
  }

  if (msg.hidden) {
    return (
      <div id={`msg-${msg.id}`} className={styles.bubbleRow}>
        <div className={styles.hiddenMessage}>
          <span>Message hidden</span>
          {(isOwn || isAdmin) && onModerate && (
            <button
              className={styles.bubbleReply}
              onClick={() =>
                isOwn ? onHide?.(msg.id, false) : onModerate?.(msg.id, false)
              }
            >
              unhide
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      id={`msg-${msg.id}`}
      className={`${styles.bubbleRow} ${isOwn ? styles.bubbleRowOwn : ''}`}
    >
      {!isOwn && (
        <Link to={`/tz/${msg.sender}`} className={styles.bubbleAvatarLink}>
          <Identicon
            address={msg.sender}
            logo={senderLogo}
            className={styles.bubbleAvatar}
          />
        </Link>
      )}
      <div>
        {!isOwn && (
          <Link to={`/tz/${msg.sender}`} className={styles.bubbleSender}>
            {senderAlias || walletPreview(msg.sender)}
          </Link>
        )}
        {msg.parentId && (
          <button className={styles.replyIndicator} onClick={scrollToParent}>
            {parentMsg
              ? `↩ ${
                  parentAlias || walletPreview(parentMsg.sender)
                }: "${parentPreview}"`
              : `↩ replying to #${msg.parentId}`}
          </button>
        )}
        {editing ? (
          <div className={styles.editArea}>
            <textarea
              className={styles.editTextarea}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submitEdit()
                }
                if (e.key === 'Escape') cancelEdit()
              }}
              rows={3}
            />
            <div className={styles.editActions}>
              <button className={styles.editBtn} onClick={submitEdit}>
                Save
              </button>
              <button className={styles.editBtn} onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`${styles.bubble} ${
              isOwn ? styles.bubbleOwn : styles.bubbleOther
            }`}
          >
            <MentionText content={msg.content} profiles={profiles} />
            {msg.embeds?.map((embed, i) => (
              <div key={i} style={{ marginTop: 6 }}>
                <TokenEmbedCard embed={embed} />
              </div>
            ))}
          </div>
        )}
        <div className={styles.bubbleMeta}>
          {msg.isIpfs && <span className={styles.bubbleIpfsBadge}>IPFS</span>}
          {isEdited && <span className={styles.edited}>edited</span>}
          <span>{displayTime}</span>
          {onReply && !editing && (
            <button className={styles.bubbleReply} onClick={() => onReply(msg)}>
              reply
            </button>
          )}
          {(isOwn || isAdmin) && !editing && (
            <div className={styles.menuWrapper}>
              <button
                type="button"
                className={styles.menuToggle}
                aria-label="Message actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                ⋯
              </button>
              {menuOpen && (
                <div className={styles.menuPopover}>
                  {isOwn && onEdit && (
                    <button className={styles.menuItem} onClick={startEdit}>
                      Edit
                    </button>
                  )}
                  {isOwn && onHide && (
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        onHide(msg.id, true)
                        setMenuOpen(false)
                      }}
                    >
                      Hide
                    </button>
                  )}
                  {isAdmin && !isOwn && onModerate && (
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        onModerate(msg.id, true)
                        setMenuOpen(false)
                      }}
                    >
                      Moderate
                    </button>
                  )}
                  {isOwn && onDelete && (
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        onDelete(msg.id)
                        setMenuOpen(false)
                      }}
                    >
                      Delete
                    </button>
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

        {historyOpen && (
          <div className={styles.history}>
            <div className={styles.historyHeader}>Edit history</div>
            {!history || history.length === 0 ? (
              <div className={styles.historyEmpty}>
                No archived versions found.
              </div>
            ) : (
              history.map((v) => (
                <div key={v.version} className={styles.historyItem}>
                  <div className={styles.historyMeta}>
                    v{v.version} · {getTimeAgo(v.timestamp)}
                  </div>
                  <div className={styles.historyContent}>{v.content}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
