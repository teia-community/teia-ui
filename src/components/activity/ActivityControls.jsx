import styles from './filters.module.scss'

export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
]

/**
 * The site's sort control. `options` lets a page sort by something other than
 * time without inventing its own control.
 */
export function ActivityControls({
  sort,
  onSortChange,
  options = SORT_OPTIONS,
  ariaLabel = 'Sort activity',
  children,
}) {
  return (
    <div className={styles.controls}>
      <div className={styles.controls_filters}>{children}</div>

      <label className={styles.sort}>
        <span className={styles.sort_label}>Sort</span>
        <select
          className={styles.sort_select}
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label={ariaLabel}
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default ActivityControls
