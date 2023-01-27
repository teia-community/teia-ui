import { Button } from '@atoms/button'
import { capitalizeFirstLetter } from '@utils/string'
import styles from '@style'
import { useContext } from 'react'
import { TeiaContext } from '@context/TeiaContext'
import { useNavigate } from 'react-router-dom'

export const MenuItem = ({ label, route, need_sync, className }) => {
  label = label ? label : capitalizeFirstLetter(route)
  const context = useContext(TeiaContext)
  const navigate = useNavigate()
  const handleRoute = (path, data) => {
    context.collapseMenu(true)
    navigate(path, { state: data })
  }
  return (
    <Button
      primary
      className={`${
        need_sync && !context.acc?.address ? styles.disabled : ''
      } ${className ? className : ''} `}
      onClick={() => {
        if (need_sync) {
          handleRoute('/sync', `/${route}`)
        } else {
          handleRoute(`/${route}`)
        }
      }}
    >
      {label}
    </Button>
  )
}
