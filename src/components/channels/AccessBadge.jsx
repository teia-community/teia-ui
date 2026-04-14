import styles from './index.module.scss'

export default function AccessBadge({ mode }) {
  const cls =
    mode === 'allowlist'
      ? styles.badgeAllowlist
      : mode === 'blocklist'
      ? styles.badgeBlocklist
      : mode === 'members_only'
      ? styles.badgeMembersOnly
      : styles.badgeUnrestricted
  const label = mode === 'members_only' ? 'Members Only' : mode
  return <span className={cls}>{label}</span>
}
