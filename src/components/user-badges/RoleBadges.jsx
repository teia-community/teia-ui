import { useAccountRoles } from '@data/roles'
import styles from './index.module.scss'

/** Display order + label + style for each account role. */
const BADGES = [
  { key: 'isMultisig', label: 'Multisig', cls: styles.badgeMultisig },
  { key: 'isModerator', label: 'Moderator', cls: styles.badgeModerator },
  { key: 'isTokenHolder', label: 'TEIA Holder', cls: styles.badgeTokenHolder },
]

/**
 * Presentational badges for a precomputed `AccountRoles` object. Use this in
 * list contexts where roles are resolved in bulk, to avoid a hook call per row.
 * Renders nothing when no roles apply.
 */
export function RoleBadgesView({ roles, className }) {
  const active = BADGES.filter(({ key }) => roles?.[key])
  if (active.length === 0) return null
  return (
    <span className={`${styles.badges} ${className ?? ''}`}>
      {active.map(({ key, label, cls }) => (
        <span key={key} className={cls}>
          {label}
        </span>
      ))}
    </span>
  )
}

/**
 * Self-fetching role badges for a single address. Drop in anywhere an account
 * is shown, the three role sets are cached app-wide, so this costs no
 * per-address requests.
 */
export default function RoleBadges({ address, className }) {
  const roles = useAccountRoles(address)
  return <RoleBadgesView roles={roles} className={className} />
}
