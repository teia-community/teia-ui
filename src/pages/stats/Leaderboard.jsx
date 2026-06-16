import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { useUserProfiles } from '@data/messaging/token-comments'
import styles from '@style'

/**
 * Ranked list of addresses with a count, resolving aliases + identicons.
 */
export default function Leaderboard({
  title,
  entries = [],
  countLabel = 'comments',
  emptyHint = 'No activity yet.',
}) {
  const { data: profiles = {} } = useUserProfiles(entries.map((e) => e.address))

  return (
    <div className={styles.card}>
      <div className={styles.card_head}>{title}</div>
      {entries.length === 0 ? (
        <div className={styles.card_empty}>{emptyHint}</div>
      ) : (
        <ol className={styles.rank_list}>
          {entries.map((e, i) => (
            <li key={e.address} className={styles.rank_row}>
              <span className={styles.rank_num}>{i + 1}.</span>
              <Identicon
                address={e.address}
                logo={profiles[e.address]?.logo}
                className={styles.rank_avatar}
              />
              <Link to={`/tz/${e.address}`} className={styles.rank_name}>
                {profiles[e.address]?.alias || walletPreview(e.address)}
              </Link>
              <span className={styles.rank_count}>
                {e.count.toLocaleString()}{' '}
                <span className={styles.muted}>{countLabel}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
