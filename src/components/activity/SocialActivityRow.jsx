import { Link } from 'react-router-dom'
import { preview } from '@utils/string'
import { socialRowSummary } from '@utils/social-activity.mjs'
import { getTimeAgo } from '@utils/time'
import { UserLink } from '@components/user-link'
import { ActivityBadge } from './ActivityBadge'
import styles from './index.module.scss'

const KIND_META = {
  channel: { label: 'Channel', color: 'channel' },
  poll_comment: { label: 'Poll', color: 'poll' },
  token_comment: { label: 'Token', color: 'token' },
}

/**
 * One row in the global "social" activity feed (public channel posts +
 * poll/token comments). Compact: type · author · content · target · time.
 *
 * @param {{ item: import('@data/messaging/useSocialActivity').SocialActivityItem,
 *           senderName?: string,
 *           tokenNames?: Record<string, string> }} props
 */
export function SocialActivityRow({ item, senderName, tokenNames }) {
  const kind = KIND_META[item.kind] || { label: 'Post', color: 'create' }
  // A post can be just an OBJKT, with no words at all.
  const summary = socialRowSummary(item.content, item.embeds, tokenNames)

  return (
    <div className={styles.social_row}>
      <div className={styles.event}>
        <ActivityBadge color={kind.color} label={kind.label} />
      </div>

      <div className={styles.from}>
        <UserLink address={item.sender} name={senderName} />
      </div>

      <div
        className={`${styles.social_content} ${
          summary.kind === 'text' ? '' : styles.social_content_muted
        }`}
        title={summary.kind === 'text' ? item.content : summary.text}
      >
        {summary.kind === 'text' ? preview(summary.text) : summary.text}
      </div>

      <div className={styles.social_target}>
        <Link to={item.to}>{item.targetLabel}</Link>
      </div>

      <div className={`${styles.num} ${styles.time}`} title={item.timestamp}>
        {getTimeAgo(item.timestamp)}
      </div>
    </div>
  )
}

export default SocialActivityRow
