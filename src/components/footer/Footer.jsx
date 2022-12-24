import React, { useContext, useState } from 'react'
import useLanguage from '../../hooks/use-language'
import styles from '@style'
import { MenuItem } from '@components/header/main_menu/MenuItem'
import { walletPreview } from '@utils/string'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { RotatingLogo } from '@atoms/logo'
import { Button } from '@atoms/button'
import { motion } from 'framer-motion'
export const Footer = () => {
  const { language } = useLanguage()
  const context = useContext(HicetnuncContext)
  const [logoSeed, setLogoSeed] = useState(3)

  const transition = () => {
    return {
      initial: {
        opacity: 0,
        y: 100,
        transition: { duration: 0.2, ease: 'easeOut' },
      },
      animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.2, ease: 'easeOut' },
      },
      exit: {
        opacity: 0,
        y: 100,
        transition: { duration: 0.2, ease: 'easeInOut' },
      },
    }
  }

  return (
    <motion.footer {...transition()} className={styles.container}>
      <div className={styles.logo}>
        Teia DAO LLC.
        <Button onClick={() => setLogoSeed(Math.random() * 100)}>
          <RotatingLogo seed={logoSeed} />
        </Button>
      </div>

      <div>
        <div className={styles.copy}>{language.footer.mint}</div>
      </div>
      <ul className={styles.menu_left}>
        <MenuItem className={styles.menu_label} route="collaborate" />
        <MenuItem className={styles.menu_label} route="about" />
        <MenuItem className={styles.menu_label} label="F.A.Q" route="faq" />
      </ul>
      <ul className={styles.menu_right}>
        <div className={styles.address}>
          {walletPreview(context.acc?.address)}
        </div>
        <MenuItem
          className={styles.menu_label}
          label="Mint"
          route="mint"
          need_sync
        />
        <MenuItem
          className={styles.menu_label}
          label="Assets"
          route="tz"
          need_sync
        />
        <MenuItem
          className={styles.menu_label}
          label="Friends"
          route="friends"
          need_sync
        />
        <MenuItem
          className={styles.menu_label}
          label="Profile"
          route="config"
          need_sync
        />
      </ul>

      {false && (
        <div>
          <div className={styles.warning}>{language.footer.warning}</div>
        </div>
      )}
    </motion.footer>
  )
}
