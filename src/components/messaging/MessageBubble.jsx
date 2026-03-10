import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useResolveMessageContent } from '@data/messaging'
import styles from '@style'

export const MessageBubble = ({
  message,
  isOwn,
  senderAlias,
  senderLogo,
  onDelete,
}) => {
  const isDeleted = message.content === ''
  const { content, loading, isIPFS } = useResolveMessageContent(
    isDeleted ? null : message.content
  )

  const renderContent = () => {
    if (isDeleted) {
      return <em style={{ opacity: 0.5 }}>Message deleted</em>
    }
    if (loading) {
      return <em style={{ opacity: 0.5 }}>Loading from IPFS...</em>
    }
    return content || message.content
  }

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
          {renderContent()}
        </div>
        <div className={styles.bubble_meta}>
          {isIPFS && <span className={styles.bubble_ipfs_badge}>IPFS</span>}
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
