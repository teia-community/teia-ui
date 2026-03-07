import { Link } from 'react-router-dom'
import { Identicon } from '@atoms/identicons'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { useUserProfiles } from '@data/swr'
import styles from '@style'

const MAX_DISPLAY_AVATARS = 3

export const ChatHeader = ({
  participants,
  userAddress,
  onInfoClick,
  onAddClick,
}) => {
  const others = participants?.filter((p) => p !== userAddress) || []
  const displayAddrs = others.slice(0, MAX_DISPLAY_AVATARS)
  const remaining = others.length - MAX_DISPLAY_AVATARS
  const [profiles] = useUserProfiles(others.length > 0 ? others : undefined)

  const nameLabel = others
    .slice(0, 2)
    .map((addr) => profiles?.[addr]?.name || walletPreview(addr))
    .join(', ')

  return (
    <div className={styles.chat_header}>
      <Link to="/messages">&larr;</Link>
      <div className={styles.chat_header_info}>
        <div className={styles.stacked_avatars}>
          {displayAddrs.map((addr) => (
            <Identicon
              key={addr}
              address={addr}
              logo={profiles?.[addr]?.identicon}
            />
          ))}
        </div>
        <span className={styles.chat_header_names}>
          {nameLabel}
          {remaining > 0 && ` +${remaining}`}
        </span>
      </div>
      <div className={styles.chat_header_actions}>
        {onAddClick && (
          <Button shadow_box onClick={onAddClick}>
            Add
          </Button>
        )}
        {onInfoClick && (
          <Button shadow_box onClick={onInfoClick}>
            Info
          </Button>
        )}
      </div>
    </div>
  )
}
