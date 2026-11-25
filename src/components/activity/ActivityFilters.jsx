import { ACTIVITY_FILTERS } from '@utils/activity'
import styles from './filters.module.scss'

/**
 * Type-filter chips shared by the profile Activity tab and the global feed.
 *
 * @param {{
 *   active: string[],
 *   onToggle: (key: string) => void,
 *   filters?: { key: string, label: string }[],
 *   tourTarget?: string,
 * }} props `tourTarget`: `data-tour` target for the chips (see components/tour)
 */
export function ActivityFilters({
  active,
  onToggle,
  filters = ACTIVITY_FILTERS,
  tourTarget,
}) {
  return (
    <div className={styles.filters} data-tour={tourTarget}>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`${styles.chip} ${
            active.includes(f.key) ? styles.chip_active : ''
          }`}
          onClick={() => onToggle(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export default ActivityFilters
