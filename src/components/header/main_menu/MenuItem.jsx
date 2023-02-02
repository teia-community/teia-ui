import { Button } from '@atoms/button'
import { capitalizeFirstLetter } from '@utils/string'
import styles from '@style'
import { useContext } from 'react'
import { TeiaContext } from '@context/TeiaContext'

export const MenuItem = ({ label, route, need_sync, className }) => {
  label = label ? label : capitalizeFirstLetter(route)
  const context = useContext(TeiaContext)

  return (
    <Button
      className={`${need_sync && !context.address ? styles.disabled : ''} ${
        className ? className : ''
      } `}
      to={need_sync ? '/sync' : `/${route}`}
      state={need_sync ? `/${route}` : null}
      onTo={() => context.collapseMenu(true)}
    >
      {label}
    </Button>
  )
}
