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

  return (
    <Button
      className={`${need_sync && !address ? styles.disabled : ''} ${
        className ? className : ''
      } `}
      to={need_sync && !address ? '/sync' : `/${route}`}
      state={need_sync && address ? `/${route}` : null}
      onTo={() => setCollapsed(true)}
    >
      <span>
        {label}
        {badge && <span className={menuStyles.menuBadge} />}
      </span>
    </Button>
  )
}
