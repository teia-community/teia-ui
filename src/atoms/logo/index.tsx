import { useLocalSettings } from '@context/localSettingsStore'
import useSettings from '@hooks/use-settings'
import styles from '@style'
import { memo } from 'react'
import { useMemo } from 'react'
import { RotatingLogoSVG } from '@icons'
import { randomSeed } from '@utils'
import { Theme } from '@types'

interface RotatingLogoProps {
  className?: string
  seed?: number
  theme?: Theme
}

export const RotatingLogoRemote = ({ className, seed = 1, theme }: RotatingLogoProps) => {
  const localTheme = useLocalSettings((state) => state.theme)
  theme = theme || localTheme
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
      {theme && logo && (
        <img
          src={`${import.meta.env.VITE_LOGOS}/logos${logo.themable ? `/${theme}` : ''
            }${logo.collection ? `/${logo.collection}` : ''}/${logo.name}`}
          alt="teia-logo"
        />
      )}
    </div>
  )
}

export const RotatingLogo = ({ className, seed = 1 }: RotatingLogoProps) => {
  const Logo = useMemo(() => {
    return RotatingLogoSVG[
      Math.floor(randomSeed(seed) * RotatingLogoSVG.length)
    ]
  }, [seed])
  return (
    <div className={styles.container}>
      <Logo fill="var(--text-color)" width="132px" />
    </div>
  )
}

export default memo(RotatingLogo)
