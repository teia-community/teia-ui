import styles from './filters.module.scss'

export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
]

export function ActivityControls({ sort, onSortChange, children }) {
  return (
    <div className={styles.controls}>
      <div className={styles.controls_filters}>{children}</div>

      <label className={styles.sort}>
        <span className={styles.sort_label}>Sort</span>
        <select
          className={styles.sort_select}
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort activity"
        >
          {SORT_OPTIONS.map((o) => (
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
