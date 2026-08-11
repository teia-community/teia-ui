import { usePlatformTable } from '@data/platform-stats'
import styles from '@style'

const num = (v) => (typeof v === 'number' ? v.toLocaleString() : '—')
const tez = (mutez) =>
  typeof mutez === 'number' ? Math.round(mutez / 1e6).toLocaleString() : '—'

export default function PlatformSection() {
  const { rows, error, isLoading } = usePlatformTable()

  if (error) {
    return (
      <div className={styles.card_empty}>
        Couldn&apos;t load platform stats.
      </div>
    )
  }
  if (isLoading) {
    return <div className={styles.card_empty}>Loading platform stats…</div>
  }

  return (
    <div className={styles.section}>
      <div className={styles.table_wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Year</th>
              <th>Mints</th>
              <th>Artists</th>
              <th>Collectors</th>
              <th>Sales</th>
              <th>Volume ꜩ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year}>
                <td>
                  {r.year}
                  {r.partial && <span className={styles.ytd}> YTD</span>}
                </td>
                <td>{num(r.mints)}</td>
                <td>{num(r.artists)}</td>
                <td>{num(r.collectors)}</td>
                <td>{num(r.sales)}</td>
                <td>{tez(r.volumeMutez)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
