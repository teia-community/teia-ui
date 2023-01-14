import useLocalSettings from '@hooks/use-local-settings'
import useSettings from '@hooks/use-settings'
import styles from '@style'
import React from 'react'
import { useMemo } from 'react'

export const RotatingLogo = ({ className, seed = 1 }) => {
  const { theme } = useLocalSettings()
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
      {true && theme !== 'unset' && (
        <img
          src={`${process.env.REACT_APP_LOGOS}/logos${
            logo.themable ? `/${theme}` : ''
          }${logo.collection ? `/${logo.collection}` : ''}/${logo.name}`}
          alt="teia-logo"
        />
      )}
    </div>
  )
}

export default RotatingLogo
