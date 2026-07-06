import styles from '@style'

export default function StatCard({ label, value, sublabel }) {
  const display =
    typeof value === 'number' ? value.toLocaleString() : value ?? '—'
  return (
    <div className={styles.stat_card}>
      <span className={styles.stat_value}>{display}</span>
      <span className={styles.stat_label}>{label}</span>
      {sublabel && <span className={styles.stat_sub}>{sublabel}</span>}
    </div>
  )
}
