import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import styles from '@style'

export const MessageBubble = ({
  message,
  isOwn,
  senderAlias,
  senderLogo,
  onDelete,
}) => {
  const isDeleted = message.content === ''

  return (
    <div
      className={`${styles.bubble_row} ${isOwn ? styles.bubble_row_own : ''}`}
    >
      {!isOwn && (
        <Identicon
          address={message.sender}
          logo={senderLogo}
          className={styles.bubble_avatar}
        />
      )}
      <div>
        {!isOwn && (
          <div className={styles.bubble_sender}>
            {senderAlias || walletPreview(message.sender)}
          </div>
        )}
        <div
          className={`${styles.bubble} ${
            isOwn ? styles.bubble_own : styles.bubble_other
          }`}
        >
          {isDeleted ? (
            <em style={{ opacity: 0.5 }}>Message deleted</em>
          ) : (
            message.content
          )}
        </div>
        <div className={styles.bubble_meta}>
          <span>{getTimeAgo(message.timestamp)}</span>
          {isOwn && !isDeleted && onDelete && (
            <button
              className={styles.bubble_delete}
              onClick={() => onDelete(message.id)}
            >
              delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
