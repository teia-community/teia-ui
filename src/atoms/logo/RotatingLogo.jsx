import { HicetnuncContext } from '@context/HicetnuncContext'
import useSettings from '@hooks/use-settings'
import styles from '@style'
import React from 'react'
import { useContext, useMemo } from 'react'

export const RotatingLogo = ({ className, seed = 1 }) => {
  const context = useContext(HicetnuncContext)
  const { logos } = useSettings()

  const logo = useMemo(
    () =>
      logos && seed && logos.length
        ? logos[Math.floor(Math.random() * logos.length)]
        : null,
    [logos, seed]
  )
  return (
    <div className={`${styles.logo} ${className ? className : ''}`}>
      {true && context.theme !== 'unset' && (
        <img
          src={`${process.env.REACT_APP_LOGOS}/logos${
            logo.themable ? '/' + context.theme : ''
          }${logo.collection ? '/' + logo.collection : ''}/${logo.name}`}
          alt="teia-logo"
        />
      )}
    </div>
  )
}

export default RotatingLogo
