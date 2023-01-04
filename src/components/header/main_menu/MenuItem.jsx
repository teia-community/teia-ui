import { Button } from '@atoms/button'
import { capitalizeFirstLetter } from '@utils/string'
import styles from '@style'
import { useContext } from 'react'
import { TeiaContext } from '@context/TeiaContext'
import { useNavigate } from 'react-router-dom'
import { Primary } from '@atoms/button'

export const MenuItem = ({ label, route, need_sync, className }) => {
  label = label ? label : capitalizeFirstLetter(route)
  const context = useContext(TeiaContext)
  const navigate = useNavigate()
  const handleRoute = (path, data) => {
    context.collapseMenu(true)
    navigate(path, { state: data })
  }
  return (
    <li>
      <Button
        onClick={() => {
          if (need_sync) {
            handleRoute('/sync', `/${route}`)
          } else {
            handleRoute(`/${route}`)
          }
        }}
      >
        <Primary
          className={`${
            need_sync && !context.acc?.address ? styles.disabled : ''
          } ${className ? className : ''} `}
        >
          {label}
        </Primary>
      </Button>
    </li>
  )
}
