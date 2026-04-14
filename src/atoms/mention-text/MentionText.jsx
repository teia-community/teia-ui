import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { parseMentions, extractMentionAddresses } from '@utils/mentions'
import { useUsers } from '@data/swr'
import styles from './MentionText.module.scss'

function MentionLink({ address, user }) {
  const [hover, setHover] = useState(false)
  const name = user?.alias || walletPreview(address)

  return (
    <span
      className={styles.mentionWrapper}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to={`/tz/${address}`} className={styles.mentionLink}>
        @{name}
      </Link>
      {hover && (
        <div className={styles.hoverCard}>
          <Identicon
            address={address}
            logo={user?.logo}
            className={styles.hoverAvatar}
          />
          <div className={styles.hoverInfo}>
            {user?.alias && (
              <div className={styles.hoverName}>{user.alias}</div>
            )}
            <div className={styles.hoverAddr}>{walletPreview(address)}</div>
          </div>
        </div>
      )}
    </span>
  )
}

export default function MentionText({ content }) {
  const segments = parseMentions(content)
  const addresses = extractMentionAddresses(content)
  const [users] = useUsers(addresses)

  if (segments.length === 0) return content
  if (segments.length === 1 && segments[0].type === 'text') return content

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'mention' ? (
          <MentionLink key={i} address={seg.value} user={users[seg.value]} />
        ) : (
          seg.value
        )
      )}
    </>
  )
}
