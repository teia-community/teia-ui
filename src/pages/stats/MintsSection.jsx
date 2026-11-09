import { Loading } from '@atoms/loading'
import StatCard from '@pages/admin/StatCard'
import { useMintStats, WEEKS } from '@data/market-stats'
import Chart from './Chart'
import styles from '@style'

const MINT_COLOR = '#1d9e75'

export default function MintsSection() {
  const { data, error, isValidating } = useMintStats()

  if (!data) {
    if (error && !isValidating) {
      return <p className={styles.muted}>Couldn’t load minting.</p>
    }
    return <Loading message="Loading minting…" />
  }

  const { minted, editions, artists, allTime, weekly } = data
  const perToken = minted > 0 ? Math.round(editions / minted) : 0

  return (
    <div className={styles.section}>
      <p className={styles.muted}>
        Artworks minted on Teia over the last {WEEKS} weeks.
      </p>

      <div className={styles.stats_grid}>
        <StatCard
          label="Artworks minted"
          value={minted}
          sublabel={`${allTime.toLocaleString()} all time`}
        />
        <StatCard label="Editions" value={editions} />
        <StatCard label="Artists minting" value={artists} />
        <StatCard label="Editions per artwork" value={perToken} />
      </div>

      <Chart
        title="Artworks minted per week"
        data={weekly}
        xKey="week"
        height={260}
        series={[{ key: 'count', label: 'Minted', color: MINT_COLOR }]}
      />
    </div>
  )
}
