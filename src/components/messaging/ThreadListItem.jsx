import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import styles from '@style'

const MAX_AVATARS = 3

export const ThreadListItem = ({
  threadId,
  rootMessage,
  info,
  participants,
  userAddress,
  profiles,
  isUnread,
}) => {
  const others = participants?.filter((p) => p !== userAddress) || []
  const displayAddrs = others.slice(0, MAX_AVATARS)

  const othersLabel = others
    .map((addr) => profiles?.[addr]?.name || walletPreview(addr))
    .join(', ')

  const preview = rootMessage?.content ? rootMessage.content.slice(0, 80) : ''

  const replyMode = info?.reply_mode ? Object.keys(info.reply_mode)[0] : null

  return (
    <Link to={`/messages/thread/${threadId}`} className={styles.thread_item}>
      <div className={styles.stacked_avatars}>
        {displayAddrs.map((addr) => (
          <Identicon
            key={addr}
            address={addr}
            logo={profiles?.[addr]?.identicon}
          />
        ))}
      </div>
      <div className={styles.thread_item_content}>
        <div className={styles.thread_item_header}>
          <span className={styles.thread_item_sender}>{othersLabel}</span>
          <span className={styles.thread_item_time}>
            {rootMessage?.timestamp ? getTimeAgo(rootMessage.timestamp) : ''}
          </span>
        </div>
        <div className={styles.thread_item_preview}>{preview}</div>
        <div className={styles.thread_item_meta}>
          {replyMode && replyMode !== 'open' && (
            <span className={styles.reply_mode_badge}>{replyMode}</span>
          )}
          {info?.reply_count > 0 && (
            <span className={styles.reply_mode_badge}>
              {info.reply_count} {info.reply_count === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
      </div>
      {isUnread && <div className={styles.unread_dot} />}
    </Link>
  )
}
