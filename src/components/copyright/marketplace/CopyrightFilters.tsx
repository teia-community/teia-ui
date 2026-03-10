import styles from './index.module.scss'

export type FilterValues = Record<string, string>

const FILTER_DEFINITIONS = [
  { key: 'publicDisplay', label: 'Public Display' },
  { key: 'reproduce', label: 'Reproduce' },
  { key: 'broadcast', label: 'Broadcast' },
  { key: 'createDerivativeWorks', label: 'Derivative Works' },
  { key: 'requireAttribution', label: 'Attribution Required' },
  { key: 'rightsAreTransferable', label: 'Transferable' },
  { key: 'expirationDate', label: 'Has Expiration' },
  { key: 'exclusiveRights', label: 'Exclusive Rights' },
  { key: 'releasePublicDomain', label: 'Public Domain' },
]

interface CopyrightFiltersProps {
  filters: FilterValues
  onChange: (filters: FilterValues) => void
}

export default function CopyrightFilters({ filters, onChange }: CopyrightFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== 'all')

  const handleChange = (key: string, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  const handleClear = () => {
    const cleared: FilterValues = {}
    FILTER_DEFINITIONS.forEach(({ key }) => (cleared[key] = 'all'))
    onChange(cleared)
  }

  return (
    <div className={styles.filtersGrid}>
      {FILTER_DEFINITIONS.map(({ key, label }) => (
        <div key={key} className={styles.filterGroup}>
          <label className={styles.filterLabel}>{label}</label>
          <select
            className={styles.filterSelect}
            value={filters[key] || 'all'}
            onChange={(e) => handleChange(key, e.target.value)}
          >
            <option value="all">All</option>
            <option value="allowed">Allowed</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      ))}
      {hasActiveFilters && (
        <div className={styles.filterActions}>
          <button className={styles.clearButton} onClick={handleClear}>
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}
