import { Link } from 'react-router-dom'
import { getTimeAgo } from '@utils/time'
import { UserLink } from '@components/user-link'
import { ActivityBadge } from './ActivityBadge'
import styles from './index.module.scss'

/**
 * One row in a governance-style activity feed (calendar / wiki / copyright):
 * action · actor · target · time.
 * This might be merged with the other activity tabs later, Indexer...
 */
export function ActionRow({
  label,
  color,
  actor,
  actorName,
  to,
  targetLabel,
  timestamp,
  href,
}) {
  return (
    <div className={styles.action_row}>
      <div className={styles.event}>
        <ActivityBadge color={color} label={label} />
      </div>

      <div className={styles.from}>
        <UserLink address={actor} name={actorName} />
      </div>

      <div className={styles.action_target}>
        {to ? <Link to={to}>{targetLabel}</Link> : <span>{targetLabel}</span>}
      </div>

      <div className={`${styles.num} ${styles.time}`} title={timestamp}>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {getTimeAgo(timestamp)}
          </a>
        ) : (
          getTimeAgo(timestamp)
        )}
      </div>
    </div>
  )
}

export default ActionRow
