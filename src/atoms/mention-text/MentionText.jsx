import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { parseMentions } from '@utils/mentions'
import styles from './MentionText.module.scss'

function MentionLink({ address, profiles }) {
  const [hover, setHover] = useState(false)
  const profile = profiles?.[address]
  const name = profile?.name || walletPreview(address)

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
            logo={profile?.identicon}
            className={styles.hoverAvatar}
          />
          <div className={styles.hoverInfo}>
            {profile?.name && (
              <div className={styles.hoverName}>{profile.name}</div>
            )}
            <div className={styles.hoverAddr}>{walletPreview(address)}</div>
          </div>
        </div>
      )}
    </span>
  )
}

export default function MentionText({ content, profiles }) {
  const segments = parseMentions(content)

  if (segments.length === 0) return content
  if (segments.length === 1 && segments[0].type === 'text') return content

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'mention' ? (
          <MentionLink key={i} address={seg.value} profiles={profiles} />
        ) : (
          seg.value
        )
      )}
    </>
  )
}
