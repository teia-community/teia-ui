import { useEffect, useMemo, useRef } from 'react'
import { Footer } from '@components/footer'
import { fadeIn } from '@utils/motion'
import styles from '@style'
import { motion } from 'framer-motion'
import { walletPreview } from '@utils/string'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'
import { useLocalSettings } from '@context/localSettingsStore'
import { useUnreadChannels, useUnreadItems } from '@context/chatReadStore'
import {
  useMyInbox,
  useChannelLatestMessageIds,
} from '@data/messaging/channels'
import { useMyPollNotifications } from '@data/messaging/poll-comments'
import { useMyTokenNotifications } from '@data/messaging/token-comments'
import { useAccountRoles } from '@data/roles'

import { MenuItem } from './MenuItem'
import { Toggle } from '@atoms/toggles'
import { ThemeSelection } from '@atoms/select'
import { shallow } from 'zustand/shallow'

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

  const messageNotifications = useLocalSettings((s) => s.messageNotifications)
  const notifAddress = messageNotifications ? address : undefined

  const { data: inbox } = useMyInbox(address)
  const inboxIds = useMemo(() => (inbox ?? []).map((c) => c.id), [inbox])
  const { data: latestIds } = useChannelLatestMessageIds(inboxIds)
  const { total: channelUnread } = useUnreadChannels(notifAddress, latestIds)

  const { data: pollMap } = useMyPollNotifications(notifAddress)
  const { total: pollUnread } = useUnreadItems(
    notifAddress,
    'poll-comments',
    pollMap
  )
  const { data: tokenMap } = useMyTokenNotifications(notifAddress)
  const { total: tokenUnread } = useUnreadItems(
    notifAddress,
    'token-comments',
    tokenMap
  )

  // Unread is surfaced in one place only: the aggregate badge on the
  // Notifications menu item (and the /notifications page). The
  // per-section dots were removed to keep the menu clean.
  const showNotificationsBadge = channelUnread + pollUnread + tokenUnread > 0

  const currentName = proxyName || userInfo?.name
  const currentAddress = proxyAddress || address

  const { isModerator, isMultisig } = useAccountRoles(address)
  const canModerate = isModerator || isMultisig

  // TODO: Search doesn't really make sense anymore? Does it? (commented out for now), will be reworked later on.
  const sections = [
    {
      title: 'Account',
      items: address
        ? [
            {
              label: 'Profile',
              route: `${currentName || 'tz/' + currentAddress}` || 'tz',
              need_sync: !currentName || !currentAddress,
            },
            {
              label: 'Notifications',
              route: 'notifications',
              need_sync: true,
              badge: showNotificationsBadge,
            },
            { label: 'Edit Profile', route: 'subjkt', need_sync: true },
            { label: 'Settings', route: 'settings' },
            ...(canModerate
              ? [{ label: 'Moderation', route: 'inbox/admin', need_sync: true }]
              : []),
          ]
        : [
            { label: 'Sign in', route: 'sync' },
            // Settings are device-local, useful signed-out too.
            { label: 'Settings', route: 'settings' },
          ],
    },
    {
      title: 'Create',
      items: [
        { label: 'Mint', route: 'mint', need_sync: true, primary: true },
        { label: 'Collaborations', route: 'collaborate', need_sync: true },
        { label: 'Register Copyright', route: 'copyright' },
      ],
    },
    {
      title: 'Explore',
      items: [
        { label: 'Search', route: 'search' },
        { label: 'Activity', route: 'activity' },
        { label: 'Text', route: 'text' },
        { label: 'Calendar', route: 'calendar' },
        { label: 'Copyright Marketplace', route: 'copyrightmarketplace' },
      ],
    },
    {
      title: 'Community & DAO',
      items: [
        { label: 'Public Channels', route: 'publicchannels' },
        { label: 'Polls', route: 'polls' },
        { label: 'DAO Governance', route: 'dao' },
        { label: 'Donate', route: 'donate' },
        { label: 'Bakers', route: 'bakers' },
      ],
    },
    {
      title: 'Learn',
      items: [
        { label: 'Wiki', route: 'wiki' },
        { label: 'Getting Started', route: 'faq' },
        { label: 'About', route: 'about' },
      ],
    },
  ]

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
        {sections.map((section) => (
          <section key={section.title} className={styles.menu_section}>
            <h2 className={styles.menu_section_title}>{section.title}</h2>
            {section.title === 'Account' && address && (
              <div className={styles.address}>{walletPreview(address)}</div>
            )}
            <ul className={styles.menu_section_list}>
              {section.items.map((item) => (
                <li key={item.label}>
                  <MenuItem
                    className={`${styles.menu_label} ${
                      item.primary ? styles.menu_primary : ''
                    }`}
                    label={item.label}
                    route={item.route}
                    need_sync={item.need_sync}
                    badge={item.badge}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className={styles.menu_section}>
          <h2 className={styles.menu_section_title}>Preferences</h2>
          <div className={styles.state_buttons}>
            <Toggle box label="ZEN" onToggle={setZen} toggled={zen} />
            <ThemeSelection className={styles.theme_selection} />
          </div>
        </section>
      </nav>
      <Footer pin />
    </motion.div>
  )
}

export default MainMenu
