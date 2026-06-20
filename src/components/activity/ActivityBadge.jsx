import { TradeIcon, MintedIcon, SwapIcon, BurnIcon } from '@icons'
import styles from './index.module.scss'

const ICONS = {
  sale: TradeIcon,
  buy: TradeIcon,
  transfer: TradeIcon,
  list: SwapIcon,
  create: MintedIcon,
  burn: BurnIcon,
}

/**
 * Colored event label used by the activity table rows and the
 * global feed card overlay.
 * @param {{ color: string, label: string, size?: number }} props
 */
export function ActivityBadge({ color, label, size = 13 }) {
  const Icon = ICONS[color] || TradeIcon
  return (
    <span className={`${styles.badge} ${styles[`badge_${color}`]}`}>
      <Icon size={size} />
      {label}
    </span>
  )
}

export default ActivityBadge
