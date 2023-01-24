import React, { useContext, useState } from 'react'
import useLanguage from '@hooks/use-language'
import styles from '@style'
import { MenuItem } from '@components/header/main_menu/MenuItem'
import { walletPreview } from '@utils/string'
import { TeiaContext } from '@context/TeiaContext'
import { Button } from '@atoms/button'
import { motion } from 'framer-motion'
import classnames from 'classnames'
import { Toggle, toggleType } from '@atoms/toggles'
import useLocalSettings from '@hooks/use-local-settings'
import { RotatingLogo } from '@atoms/logo'
import useSettings from '@hooks/use-settings'

export const Footer = ({ menu, pin }) => {
  const { language } = useLanguage()
  const context = useContext(TeiaContext)
  const [logoSeed, setLogoSeed] = useState(3)
  const { zen, setZen, theme, toggleTheme } = useLocalSettings()
  const { logos } = useSettings()

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
    [styles.content]: true,
    [styles.pinned]: pin,
    [styles.minimal]: !menu,
  })

  return (
    <div className={styles.container}>
      <motion.footer {...transition()} className={classes}>
        <div className={styles.logo}>
          Teia DAO LLC.
          <Button onClick={() => setLogoSeed(Math.random() * 100)}>
            <RotatingLogo theme={theme} logos={logos} seed={logoSeed} />
          </Button>
        </div>

        <div className={styles.copyright}>{language.footer.mint}</div>
        {menu && (
          <>
            <div className={styles.menus}>
              <ul className={styles.menu_left}>
                <MenuItem className={styles.menu_label} route="collaborate" />
                <MenuItem className={styles.menu_label} route="about" />
                <MenuItem
                  className={styles.menu_label}
                  label="F.A.Q"
                  route="faq"
                />
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
            </div>
            <div className={styles.state_buttons}>
              <Toggle
                kind={toggleType.BOX}
                onToggle={toggleTheme}
                initial={theme === 'dark'}
              />
              <Toggle
                kind={toggleType.BOX}
                label="ZEN"
                onToggle={setZen}
                toggled={zen}
              />
            </div>
          </>
        )}

        {false && (
          <div>
            <div className={styles.warning}>{language.footer.warning}</div>
          </div>
        )}
      </motion.footer>
    </div>
  )
}
