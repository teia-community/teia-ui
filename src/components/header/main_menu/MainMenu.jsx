import { useEffect, useRef } from 'react'
import { Footer } from '@components/footer'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { motion } from 'framer-motion'
import { walletPreview } from '@utils/string'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'

import { MenuItem } from './MenuItem'
import { Toggle } from '@atoms/toggles'
import { Line } from '@atoms/line'
import { ThemeSelection } from '@atoms/select'
import { shallow } from 'zustand/shallow'
import { useLocalSettings } from '@context/localSettingsStore'

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'

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
  const setCollapsed = useModalStore((st) => st.setCollapsed)

  const menuRef = useRef(null)
  const previousFocusRef = useRef(document.activeElement)

  useEffect(() => {
    const menuEl = menuRef.current
    if (!menuEl) return

    // Focus the first focusable element (Search)
    const first = menuEl.querySelector(FOCUSABLE)
    if (first) first.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCollapsed(true)
        return
      }

      if (e.key === 'Tab') {
        const focusable = menuEl.querySelectorAll(FOCUSABLE)
        if (focusable.length === 0) return

        const firstEl = focusable[0]
        const lastEl = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the element that triggered the menu
      if (previousFocusRef.current?.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [setCollapsed])

  const currentName = proxyName || userInfo?.name
  const currentAddress = proxyAddress || address

  // TODO: Search doesn't really make sense anymore? Does it? (commented out for now)
  return (
    <motion.div
      ref={menuRef}
      className={`${styles.menu}`}
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      {...fadeIn()}
    >
      <nav className={`${styles.content}`}>
        <div className={`${styles.menu_left}`}>
          {/* <MenuItem route="search" /> */}
          <MenuItem className={styles.menu_label} route="search" />
          <MenuItem className={styles.menu_label} route="about" />
          <MenuItem
            className={styles.menu_label}
            label="Getting Started"
            route="faq"
          />
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
            route={`${currentName || 'tz/' + currentAddress}` || 'tz'}
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

          <MenuItem
            className={styles.menu_label}
            label="DAO Governance"
            route="dao"
          />

          <MenuItem
            className={styles.menu_label}
            label="Donate"
            route="donate"
          />

          <MenuItem
            className={styles.menu_label}
            label="Copyright"
            route="copyright"
          />

          <MenuItem className={styles.menu_label} label="Polls" route="polls" />
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
