import { useState } from 'react'
import useLanguage from '@hooks/use-language'
import styles from '@style'
import { MenuItem } from '@components/header/main_menu/MenuItem'
import { Button } from '@atoms/button'
import { motion } from 'framer-motion'
import classnames from 'classnames'
import { Toggle } from '@atoms/toggles'
import { useLocalSettings } from '@context/localSettingsStore'
import { RotatingLogo } from '@atoms/logo'
import useSettings from '@hooks/use-settings'
import { Line } from '@atoms/line'
import { shallow } from 'zustand/shallow'
import { useUserStore } from '@context/userStore'

interface FooterProps {
  menu?: boolean
  pin?: boolean
}

export const Footer = ({ menu, pin }: FooterProps) => {
  const { language } = useLanguage()
  const address = useUserStore((st) => st.address)
  const [logoSeed, setLogoSeed] = useState(3)
  const [zen, setZen] = useLocalSettings((st) => [st.zen, st.setZen], shallow)
  const [theme, toggleTheme] = useLocalSettings(
    (st) => [st.theme, st.toggleTheme],
    shallow
  )

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
    [styles.container]: true,
    [styles.pinned]: pin,
  })
  const classes_content = classnames({
    [styles.content]: true,
    [styles.minimal]: !menu,
  })

  return (
    <motion.div {...transition()} className={classes}>
      <Line />
      <motion.footer {...transition()} className={classes_content}>
        <div className={styles.logo}>
          Teia DAO LLC.
          {menu && (<>
            <Button
              alt="teia rotating logo"
              onClick={() => setLogoSeed(Math.random() * 100)}
            >
              <RotatingLogo seed={logoSeed} />
            </Button>
          </>
          )}
          <a href="https://tzkt.io/">Powered by TzKT API</a>
        </div>
        <div className={styles.copyright}>
          <div>
            {language.footer.mint}
          </div>
          <div className={styles.menuitems}>
            <MenuItem
              className={styles.menu_label_row}
              route="about"
            />
            <MenuItem
              className={styles.menu_label_row}
              label="F.A.Q"
              route="faq"
            />
            <MenuItem
              className={styles.menu_label_row}
              label="Core Values"
              route="corevalues"
            />
            <MenuItem
              className={styles.menu_label_row}
              label="Code of Conduct"
              route="codeofconduct"
            />
            <MenuItem
              className={styles.menu_label_row}
              label="Terms and Conditions"
              route="terms"
            />
            <MenuItem
              className={styles.menu_label_row}
              label="Privacy Policy"
              route="privacypolicy"
            />
          </div>
        </div>
        {menu && (
          <>
            <div className={styles.menus}>

              <Line vertical />

            </div>
            {false && (
              <div className={styles.state_buttons}>
                <Toggle box onToggle={toggleTheme} initial={theme === 'dark'} />
                <Toggle box label="ZEN" onToggle={setZen} toggled={zen} />
              </div>
            )}
          </>
        )}

        {false && (
          <div>
            <div className={styles.warning}>{language.footer.warning}</div>
          </div>
        )}
      </motion.footer>
    </motion.div>
  )
}
