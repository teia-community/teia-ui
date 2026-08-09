import CurationCard from './CurationCard'
import styles from '@style'

export default function CurationGrid({
  curations,
  emptyMessage = 'No curations yet.',
}) {
  if (!curations.length) {
    return <p className={styles.empty}>{emptyMessage}</p>
  }
  return (
    <div className={styles.grid}>
      {curations.map((curation) => (
        <CurationCard key={curation.id} curation={curation} />
      ))}
    </div>
  )
}
