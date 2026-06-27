import { useMemo } from 'react'
import { diffSegments } from '@utils/diff'
import styles from '@style'

/**
 * Highlights the changes of a wiki page. Additions are shown in green, removals struck through in red.
 */
export default function WikiDiff({ oldText = '', newText = '' }) {
  const segments = useMemo(
    () => diffSegments(oldText, newText),
    [oldText, newText]
  )

  const hasChanges = segments.some((s) => s.type !== 'equal')
  if (!hasChanges) {
    return <p className={styles.diff_empty}>No text changes in this edit.</p>
  }

  return (
    <pre className={styles.diff}>
      {segments.map((seg, i) => {
        if (seg.type === 'added') {
          return (
            <ins key={i} className={styles.diff_added}>
              {seg.value}
            </ins>
          )
        }
        if (seg.type === 'removed') {
          return (
            <del key={i} className={styles.diff_removed}>
              {seg.value}
            </del>
          )
        }
        return <span key={i}>{seg.value}</span>
      })}
    </pre>
  )
}
