import { Footer } from '@components/footer'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { motion } from 'framer-motion'
import { walletPreview } from '@utils/string'
import { TeiaContext } from '@context/TeiaContext'
import { useContext } from 'react'
import { MenuItem } from './MenuItem'
import { Toggle, toggleType } from '@atoms/toggles'
import useLocalSettings from '@hooks/use-local-settings'

/**
 * The main global menu.
 * @returns {React.ReactElement}
 */
export const MainMenu = () => {
  const context = useContext(TeiaContext)

  const { zen, setZen, theme, toggleTheme } = useLocalSettings()

  // TODO: Search doesn't really make sense anymore? Does it? (commented out for now)
  return (
    <motion.div className={styles.menu} {...fadeIn()}>
      <nav className={styles.content}>
        <div className={`line-vertical ${styles.menu_left}`}>
          {/* <MenuItem route="search" /> */}
          <MenuItem className={styles.menu_label} route="collaborate" />
          <MenuItem className={styles.menu_label} route="about" />
          <MenuItem className={styles.menu_label} label="F.A.Q" route="faq" />
        </div>
        <div className={styles.menu_right}>
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
              onToggle={toggleTheme}
              toggled={theme === 'dark'}
            />
            <Toggle
              kind={toggleType.BOX}
              label="ZEN"
              onToggle={setZen}
              toggled={zen}
            />
          </div>
        </div>
      </nav>
      <Footer pin />
    </motion.div>
  )
}

export default MainMenu
