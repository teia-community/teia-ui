import styles from '@style'

export default function AccessBadge({ mode }) {
  const cls =
    mode === 'allowlist'
      ? styles.badgeAllowlist
      : mode === 'blocklist'
      ? styles.badgeBlocklist
      : styles.badgeUnrestricted
  return <span className={cls}>{mode}</span>
}
