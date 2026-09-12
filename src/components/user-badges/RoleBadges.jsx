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
 * Roles from most to fewest rights: a multisig core member outranks a
 * moderator, who outranks a token holder. Only the highest one is shown.
 */
const ROLE_EMOJI = [
  { key: 'isMultisig', emoji: '📃', label: 'Multisig core member' },
  { key: 'isModerator', emoji: '🛠️', label: 'Moderator' },
  { key: 'isTokenHolder', emoji: '🪙', label: 'TEIA token holder' },
]

/**
 * Key to the role emoji, read from the same list the badges use so the two
 * cannot drift apart. Listed from fewest to most rights.
 */
export function RoleLegend({ className }) {
  return (
    <span className={className}>
      {[...ROLE_EMOJI].reverse().map(({ key, emoji, label }, i) => (
        <span key={key}>
          {i > 0 && ' · '}
          <span role="img" aria-hidden="true">
            {emoji}
          </span>{' '}
          {label}
        </span>
      ))}
      {' — each author shows their highest role.'}
    </span>
  )
}

/**
 * A single emoji for an address's highest role, for placing in front of an
 * alias or wallet address. Renders nothing when the address has no role.
 */
export function RoleEmoji({ address, className }) {
  const roles = useAccountRoles(address)
  const top = ROLE_EMOJI.find(({ key }) => roles[key])
  if (!top) return null
  return (
    <span
      className={className}
      role="img"
      aria-label={top.label}
      title={top.label}
    >
      {top.emoji}
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
