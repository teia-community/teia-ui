import React, { useContext, useState } from 'react'
import useLanguage from '@hooks/use-language'
import styles from '@style'
import { MenuItem } from '@components/header/main_menu/MenuItem'
import { walletPreview } from '@utils/string'
import { TeiaContext } from '@context/TeiaContext'
import { Button } from '@atoms/button'
import { motion } from 'framer-motion'
import loadable from '@loadable/component'
import classnames from 'classnames'
import { Toggle, toggleType } from '@atoms/toggles'

const RotatingLogo = loadable(() => import('@atoms/logo/RotatingLogo'))

export const Footer = ({ menu, pin }) => {
  const { language } = useLanguage()
  const context = useContext(TeiaContext)
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
  const classes = classnames({
    [styles.container]: true,
    [styles.pinned]: pin,
    [styles.minimal]: !menu,
  })

  return (
    <motion.footer {...transition()} className={classes}>
      <div className={styles.logo}>
        Teia DAO LLC.
        <Button onClick={() => setLogoSeed(Math.random() * 100)}>
          <RotatingLogo seed={logoSeed} />
        </Button>
      </div>

      <div>
        <div className={styles.copy}>{language.footer.mint}</div>
      </div>
      {menu && (
        <>
          <ul className={styles.menu_left}>
            <MenuItem className={styles.menu_label} route="collaborate" />
            <MenuItem className={styles.menu_label} route="about" />
            <MenuItem className={styles.menu_label} label="F.A.Q" route="faq" />
          </ul>
          <ul className={styles.menu_right}>
            <li className={styles.address}>
              {walletPreview(context.acc?.address)}
            </li>
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
          <div className={styles.state_buttons}>
            <Toggle
              kind={toggleType.BOX}
              onToggle={context.toggleTheme}
              initial={context.theme === 'dark'}
            />
            <Toggle kind={toggleType.BOX} label="ZEN" />
          </div>
        </>
      )}

      {false && (
        <div>
          <div className={styles.warning}>{language.footer.warning}</div>
        </div>
      )}
    </motion.footer>
  )
}
