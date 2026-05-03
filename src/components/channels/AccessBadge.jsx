import styles from './index.module.scss'

const CLASS_BY_MODE = {
  allowlist: styles.badgeAllowlist,
  closed: styles.badgeClosed,
  unrestricted: styles.badgeUnrestricted,
}

export default function AccessBadge({ mode }) {
  const cls = CLASS_BY_MODE[mode] ?? styles.badgeUnrestricted
  return <span className={cls}>{mode}</span>
}
