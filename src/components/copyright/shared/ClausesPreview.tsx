import type { CopyrightClauses } from './CopyrightTypes'
import styles from './index.module.scss'

const CLAUSE_LABELS: Array<{ key: keyof CopyrightClauses; label: string }> = [
  { key: 'reproduce', label: 'Reproduce' },
  { key: 'broadcast', label: 'Broadcast' },
  { key: 'publicDisplay', label: 'Display' },
  { key: 'createDerivativeWorks', label: 'Derivatives' },
  { key: 'requireAttribution', label: 'Attribution' },
  { key: 'rightsAreTransferable', label: 'Transferable' },
  { key: 'releasePublicDomain', label: 'Public Domain' },
]

interface ClausesPreviewProps {
  clauses: CopyrightClauses
  compact?: boolean
}

export default function ClausesPreview({ clauses, compact }: ClausesPreviewProps) {
  // In compact mode, only show the "allowed" clauses to reduce noise
  const items = compact
    ? CLAUSE_LABELS.filter(({ key }) => clauses[key] === true)
    : CLAUSE_LABELS.filter(({ key }) => typeof clauses[key] === 'boolean')

  return (
    <div className={styles.clausesBadges}>
      {items.map(({ key, label }) => {
        const value = clauses[key]
        return (
          <span
            key={key}
            className={`${styles.badge} ${value ? styles.badgeAllowed : styles.badgeDenied}`}
          >
            {label}
          </span>
        )
      })}
      {compact && items.length === 0 && (
        <span className={`${styles.badge} ${styles.badgeDenied}`}>Standard</span>
      )}
    </div>
  )
}
