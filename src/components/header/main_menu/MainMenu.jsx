import { Footer } from '@components/footer'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { motion } from 'framer-motion'
import { walletPreview } from '@utils/string'
import { TeiaContext } from '@context/TeiaContext'
import { useContext } from 'react'
import { MenuItem } from './MenuItem'
import { Toggle, toggleType } from '@atoms/toggles'
import { LocalSettingsContext } from '@context/LocalSettingsProvider'

/**
 * The main global menu.
 * @returns {React.ReactElement}
 */
export const MainMenu = () => {
  const context = useContext(TeiaContext)

  const { zen, setZen } = useContext(LocalSettingsContext)

  // TODO: Search doesn't really make sense anymore? Does it? (commented out for now)
  return (
    <motion.div className={styles.menu} {...fadeIn()}>
      <nav className={styles.content}>
        <ul className={`${styles.line} ${styles.menu_left}`}>
          {/* <MenuItem route="search" /> */}
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
          <div className={styles.state_buttons}>
            <Toggle
              kind={toggleType.BOX}
              onToggle={context.toggleTheme}
              toggled={context.theme === 'dark'}
            />
            <Toggle
              kind={toggleType.BOX}
              label="ZEN"
              onToggle={setZen}
              togggled={zen}
            />
          </div>
        </ul>
      </nav>
      <Footer pin />
    </motion.div>
  )
}

export default MainMenu
