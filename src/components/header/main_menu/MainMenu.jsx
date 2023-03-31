import { Footer } from '@components/footer'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { motion } from 'framer-motion'
import { walletPreview } from '@utils/string'
import { useUserStore } from '@context/userStore'

import { MenuItem } from './MenuItem'
import { Toggle } from '@atoms/toggles'
import { Line } from '@atoms/line'
import { ThemeSelection } from '@atoms/select'
import { shallow } from 'zustand/shallow'
import { useLocalSettings } from '@context/localSettingsStore'

/**
 * The main global menu.
 * @returns {React.ReactElement}
 */
export const MainMenu = () => {
  const [address, proxyName, proxyAddress, userInfo] = useUserStore(
    (st) => [st.address, st.proxyName, st.proxyAddress, st.userInfo],
    shallow
  )
  const [zen, setZen] = useLocalSettings((st) => [st.zen, st.setZen])

  const currentName = proxyName || userInfo?.name
  const currentAddress = proxyAddress || address

  // TODO: Search doesn't really make sense anymore? Does it? (commented out for now)
  return (
    <motion.div className={`${styles.menu}`} {...fadeIn()}>
      <nav className={`${styles.content}`}>
        <div className={`${styles.menu_left}`}>
          {/* <MenuItem route="search" /> */}
          <MenuItem className={styles.menu_label} route="search" />
          <MenuItem className={styles.menu_label} route="about" />
          <MenuItem className={styles.menu_label} label="F.A.Q" route="faq" />
        </div>
        <Line className={styles.line} vertical />
        <div className={styles.menu_right}>
          <div className={styles.address}>{walletPreview(address)}</div>
          <MenuItem
            className={styles.menu_label}
            label="Mint"
            route="mint"
            need_sync
          />
          <MenuItem
            className={styles.menu_label}
            label="Assets"
            route={`${currentName || currentAddress}` || 'tz'}
            need_sync={!currentName || !currentAddress}
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
            <ThemeSelection className={styles.theme_selection} />
          </div>
        </div>
      </nav>
      <Footer pin />
    </motion.div>
  )
}

export default MainMenu
