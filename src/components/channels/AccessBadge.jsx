import styles from './index.module.scss'

const CLASS_BY_MODE = {
  allowlist: styles.badgeAllowlist,
  closed: styles.badgeClosed,
  unrestricted: styles.badgeUnrestricted,
}

const LABEL_BY_MODE = {
  unrestricted: 'open',
  closed: 'private',
}

export default function AccessBadge({ mode }) {
  const cls = CLASS_BY_MODE[mode] ?? styles.badgeUnrestricted
  return <span className={cls}>{LABEL_BY_MODE[mode] ?? mode}</span>
}
