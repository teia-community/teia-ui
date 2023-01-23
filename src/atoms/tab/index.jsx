import Button from '@atoms/button/Button'
import Primary from '@atoms/button/Primary'
import { useLocation } from 'react-router'
import styles from '@style'

export function Tab({ children, to }) {
  const location = useLocation()
  const current = location.pathname.split('/')
  return (
    <Button
      className={styles.tab}
      to={to}
      selected={current && current[current.length - 1] === to}
    >
      {children}
    </Button>
  )
}
