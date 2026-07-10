import { Button } from '@atoms/button'
import { capitalizeFirstLetter } from '@utils/string'
import styles from '@style'
import menuStyles from './index.module.scss'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'

interface MenuItemProps {
  label?: string
  route: string
  need_sync?: boolean
  className?: string
  badge?: boolean
}

export const MenuItem = ({
  label,
  route,
  need_sync,
  className,
  badge,
}: MenuItemProps) => {
  label = label ? label : capitalizeFirstLetter(route)

  const address = useUserStore((st) => st.address)
  const setCollapsed = useModalStore((st) => st.setCollapsed)
  const locked = need_sync && !address

  return (
    <Button
      className={`${locked ? styles.disabled : ''} ${
        className ? className : ''
      } `}
      to={locked ? '/sync' : `/${route}`}
      state={need_sync && address ? `/${route}` : null}
      onTo={() => setCollapsed(true)}
    >
      <span>
        {label}
        {badge && (
          <>
            <span className={menuStyles.menuBadge} aria-hidden="true" />
            <span className={menuStyles.visually_hidden}> (unread)</span>
          </>
        )}
        {locked && (
          <span className={menuStyles.visually_hidden}>
            {' '}
            — sign in required
          </span>
        )}
      </span>
    </Button>
  )
}
