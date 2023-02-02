import { Footer } from '@components/footer'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { motion } from 'framer-motion'
import { walletPreview } from '@utils/string'
import { TeiaContext } from '@context/TeiaContext'
import { useContext } from 'react'
import { MenuItem } from './MenuItem'
import { Toggle } from '@atoms/toggles'
import useLocalSettings from '@hooks/use-local-settings'
import { Line } from '@atoms/line'
import { THEMES, THEME_OPTIONS } from '@constants'
import Select from '@atoms/select'

/**
 * The main global menu.
 * @returns {React.ReactElement}
 */
export const MainMenu = () => {
  const context = useContext(TeiaContext)

  const { zen, setZen, theme, setTheme } = useLocalSettings()

  // TODO: Search doesn't really make sense anymore? Does it? (commented out for now)
  return (
    <motion.div className={styles.menu} {...fadeIn()}>
      <nav className={styles.content}>
        <div className={`${styles.menu_left}`}>
          {/* <MenuItem route="search" /> */}
          <MenuItem className={styles.menu_label} route="about" />
          <MenuItem className={styles.menu_label} label="F.A.Q" route="faq" />
        </div>
        <Line className={styles.line} vertical />
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
            need_sync
            route="collaborate"
          />

          <MenuItem
            className={styles.menu_label}
            label="Profile"
            route="subjkt"
            need_sync
          />
          <div className={styles.state_buttons}>
            {/* <Toggle box onToggle={toggleTheme} toggled={theme === 'dark'} /> */}
            <Toggle box label="ZEN" onToggle={setZen} toggled={zen} />
            <Select
              alt="theme selection"
              value={{ label: THEMES[theme], value: theme }}
              onChange={(e) => setTheme(e.value)}
              options={THEME_OPTIONS}
            />
          </div>
        </div>
      </nav>
      <Footer pin />
    </motion.div>
  )
}

export default MainMenu
