import styles from './index.module.scss'

/**
 * Grey event label used by the activity table rows and the
 * global feed card overlay.
 * @param {{ color: string, label: string }} props
 */
export function ActivityBadge({ color, label }) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${color}`]}`}>
      {label}
    </span>
  )
}

export default ActivityBadge
