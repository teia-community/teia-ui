import useLocalSettings from '@hooks/use-local-settings'
import useSettings from '@hooks/use-settings'
import styles from '@style'
import React from 'react'
import { memo } from 'react'
import { useMemo } from 'react'
import { RotatingLogoSVG } from '@icons'
import { randomSeed } from '@utils'
export const RotatingLogoRemote = ({ className, seed = 1 }) => {
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
      {true && theme !== 'unset' && logo && (
        <img
          src={`${import.meta.env.VITE_LOGOS}/logos${
            logo.themable ? `/${theme}` : ''
          }${logo.collection ? `/${logo.collection}` : ''}/${logo.name}`}
          alt="teia-logo"
        />
      )}
    </div>
  )
}

export const RotatingLogo = ({ className, seed = 1 }) => {
  const Logo = useMemo(() => {
    return RotatingLogoSVG[
      Math.floor(randomSeed(seed) * RotatingLogoSVG.length)
    ]
  }, [seed])
  return (
    <div>
      <Logo fill="var(--text-color)" width="132px" />
    </div>
  )
}

export default memo(RotatingLogo)
