import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import MentionText from '@atoms/mention-text/MentionText'
import TokenEmbedCard from '@atoms/token-embed-card/TokenEmbedCard'
import styles from './index.module.scss'

/**
 * Shared message bubble component used across channels, DMs, and token gate chats.
 */
export default function MessageBubble({
  msg,
  isOwn,
  senderAlias,
  senderLogo,
  onDelete,
  onReply,
  parentMsg,
  parentAlias,
  profiles,
}) {
  const displayTime = msg.timestamp ? getTimeAgo(msg.timestamp) : ''

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
        {msg.parentId && (
          <button className={styles.replyIndicator} onClick={scrollToParent}>
            {parentMsg
              ? `↩ ${
                  parentAlias || walletPreview(parentMsg.sender)
                }: "${parentPreview}"`
              : `↩ replying to #${msg.parentId}`}
          </button>
        )}
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
        <div className={styles.bubbleMeta}>
          {msg.isIpfs && <span className={styles.bubbleIpfsBadge}>IPFS</span>}
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
