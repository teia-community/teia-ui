import { useMemo, useState } from 'react'
import classnames from 'classnames'
import StatCard from '@pages/admin/StatCard'
import { useSalesEvents, aggregateSales, MAX_DAYS } from '@data/sales-stats'
import Chart from './Chart'
import styles from '@style'

const PRIMARY_COLOR = '#e8871a'
const SECONDARY_COLOR = '#0891b2'

const WINDOWS = [
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
  { key: MAX_DAYS, label: '6 months' },
]

export default function SalesSection() {
  const [days, setDays] = useState(MAX_DAYS)
  const [progress, setProgress] = useState(null)

  const { data: events, error } = useSalesEvents({ onProgress: setProgress })

  const since = useMemo(
    () => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    [days]
  )
  const data = useMemo(
    () => (events ? aggregateSales(events, { since }) : null),
    [events, since]
  )

  const primaryShare =
    data && data.totalVolume > 0
      ? Math.round((data.primaryVolume / data.totalVolume) * 100)
      : 0

  return (
    <div className={styles.section}>
      <div className={styles.filter_row}>
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            type="button"
            className={classnames(styles.chip, {
              [styles.chip_active]: days === w.key,
            })}
            onClick={() => setDays(w.key)}
          >
            {w.label}
          </button>
        ))}
      </div>

      {!data ? (
        error ? (
          <p className={styles.muted}>Couldn&apos;t load sales stats.</p>
        ) : (
          <p className={styles.muted}>
            Loading sales… {(progress ?? 0).toLocaleString()} rows
          </p>
        )
      ) : (
        <>
          <div className={styles.stats_grid}>
            <StatCard
              label="Sales"
              value={data.totalCount}
              sublabel="Teia + HEN"
            />
            <StatCard
              label="Volume ꜩ"
              value={data.totalVolume}
              sublabel="Teia + HEN"
            />
            <StatCard
              label="Primary share"
              value={`${primaryShare}%`}
              sublabel="of volume"
            />
          </div>

          <Chart
            title="Weekly volume (ꜩ)"
            data={data.weekly}
            xKey="week"
            series={[
              { key: 'primaryVolume', label: 'Primary', color: PRIMARY_COLOR },
              {
                key: 'secondaryVolume',
                label: 'Secondary',
                color: SECONDARY_COLOR,
              },
            ]}
          />

          <Chart
            title="Weekly sales"
            data={data.weekly}
            xKey="week"
            series={[
              { key: 'primaryCount', label: 'Primary', color: PRIMARY_COLOR },
              {
                key: 'secondaryCount',
                label: 'Secondary',
                color: SECONDARY_COLOR,
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
