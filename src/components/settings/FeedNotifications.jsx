import { useCallback, useEffect, useRef, useState } from 'react'
import { Checkbox } from '@atoms/input'
import { Button } from '@atoms/button'
import { ACTIVITY_FEEDS } from '@constants'
import { useLocalSettings } from '@context/localSettingsStore'
import { useFeedReadStore } from '@context/feedReadStore'
import styles from './FeedNotifications.module.scss'

const SAVED_MESSAGE_MS = 2500

/**
 * Picks which activity feeds light the dot on the Activity menu item.
 *
 * Switching a feed on marks it read first, so the dot answers "anything since
 * you asked?" rather than lighting up for everything that already happened.
 */
export default function FeedNotifications() {
  const [feedNotifications, setFeedNotification, setAllFeedNotifications] =
    useLocalSettings((st) => [
      st.feedNotifications,
      st.setFeedNotification,
      st.setAllFeedNotifications,
    ])
  const markSeen = useFeedReadStore((st) => st.markSeen)

  const [saved, setSaved] = useState(false)
  const timer = useRef(null)

  const announceSaved = useCallback(() => {
    setSaved(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), SAVED_MESSAGE_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const toggle = (key, on) => {
    if (on) markSeen(key)
    setFeedNotification(key, on)
    announceSaved()
  }

  const setAll = (on) => {
    if (on) ACTIVITY_FEEDS.forEach((feed) => markSeen(feed.key))
    setAllFeedNotifications(on)
    announceSaved()
  }

  const enabledCount = ACTIVITY_FEEDS.filter(
    (feed) => feedNotifications[feed.key]
  ).length

  return (
    <>
      <p>
        <strong>Activity feed notifications</strong>
      </p>
      <p className={styles.explainer}>
        Pick the feeds worth a dot on the Activity menu. Teia checks them once
        when the site loads, and opening a feed marks it read. These choices are
        saved in this browser only, so another device — or this one after you
        clear its data — starts again with everything off.
      </p>

      <div className={styles.bulk}>
        <Button shadow_box onClick={() => setAll(true)}>
          Check all
        </Button>
        <Button shadow_box onClick={() => setAll(false)}>
          Uncheck all
        </Button>
        <span className={styles.count} role="status" aria-live="polite">
          {saved
            ? 'Settings updated'
            : `${enabledCount} of ${ACTIVITY_FEEDS.length} watched`}
        </span>
      </div>

      {ACTIVITY_FEEDS.map((feed) => (
        <Checkbox
          key={feed.key}
          alt={`click to ${
            feedNotifications[feed.key] ? 'stop' : 'start'
          } watching the ${feed.label} activity feed`}
          checked={Boolean(feedNotifications[feed.key])}
          onCheck={(on) => toggle(feed.key, on)}
          label={feed.label}
        />
      ))}
    </>
  )
}
