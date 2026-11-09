import { Loading } from '@atoms/loading'
import StatCard from '@pages/admin/StatCard'
import { useMarketplaceStats, WEEKS } from '@data/market-stats'
import Chart from './Chart'
import styles from '@style'

const LIST_COLOR = '#8b5cf6'
const COLLECT_COLOR = '#1a73e8'

export default function MarketplaceSection() {
  const { data, error, isValidating } = useMarketplaceStats()

  if (!data) {
    if (error && !isValidating) {
      return <p className={styles.muted}>Couldn’t load marketplace activity.</p>
    }
    return <Loading message="Loading marketplace activity…" />
  }

  const { listed, cancelled, collected, collaborations, weekly } = data

  return (
    <div className={styles.section}>
      <p className={styles.muted}>
        What happened on Teia’s own marketplace contract over the last {WEEKS}{' '}
        weeks. Sales elsewhere are under Sales.
      </p>

      <div className={styles.stats_grid}>
        <StatCard label="Listed for sale" value={listed} />
        <StatCard label="Collected" value={collected} />
        <StatCard label="Listings cancelled" value={cancelled} />
        <StatCard label="Collaborations created" value={collaborations} />
      </div>

      <Chart
        title="Listings and collects per week"
        data={weekly}
        xKey="week"
        height={260}
        series={[
          { key: 'listed', label: 'Listed', color: LIST_COLOR },
          { key: 'collected', label: 'Collected', color: COLLECT_COLOR },
        ]}
      />
    </div>
  )
}
