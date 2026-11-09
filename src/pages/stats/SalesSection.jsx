import { Loading } from '@atoms/loading'
import StatCard from '@pages/admin/StatCard'
import { useSalesStats, WEEKS } from '@data/market-stats'
import Chart from './Chart'
import styles from '@style'

const SALES_COLOR = '#8b5cf6'
const VOLUME_COLOR = '#1a73e8'

const tez = (amount) => `${Math.round(amount).toLocaleString()} ꜩ`

export default function SalesSection() {
  const { data, error, isValidating } = useSalesStats()

  if (!data) {
    if (error && !isValidating) {
      return <p className={styles.muted}>Couldn’t load sales.</p>
    }
    return <Loading message="Loading sales…" />
  }

  const { totals, venues, weekly, allTime } = data
  const average = totals.count > 0 ? totals.volume / totals.count : 0

  return (
    <div className={styles.section}>
      <p className={styles.muted}>
        Sales of Teia artworks over the last {WEEKS} weeks, wherever they were
        sold, as recorded by the Teia indexer.
      </p>

      <div className={styles.stats_grid}>
        <StatCard
          label="Sales"
          value={totals.count}
          sublabel={`${allTime.toLocaleString()} all time`}
        />
        <StatCard label="Volume" value={tez(totals.volume)} />
        <StatCard label="Average price" value={tez(average)} />
        <StatCard label="Highest sale" value={tez(totals.topPrice)} />
        <StatCard label="Collectors" value={totals.buyers} />
      </div>

      <Chart
        title="Sales per week"
        data={weekly}
        xKey="week"
        height={260}
        series={[{ key: 'count', label: 'Sales', color: SALES_COLOR }]}
      />

      <Chart
        title="Volume per week (tez)"
        data={weekly}
        xKey="week"
        height={200}
        series={[{ key: 'volume', label: 'Volume', color: VOLUME_COLOR }]}
      />

      <div className={styles.card}>
        <div className={styles.card_head}>Where they sold</div>
        <ul className={styles.rank_list}>
          {venues.map((venue) => (
            <li key={venue.key} className={styles.rank_row}>
              <span className={styles.rank_name}>{venue.label}</span>
              <span className={styles.rank_count}>
                {venue.count.toLocaleString()} sales · {tez(venue.volume)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
