import { lazy, Suspense } from 'react'
import styles from '@style'

// Lazy so recharts ships in its own async chunk, loaded only on /stats.
const TimeSeriesChart = lazy(() => import('./TimeSeriesChart'))

/**
 * Card wrapper around the lazy time-series chart, with a titled header to
 * match the ube-wiki layout.
 */
export default function Chart({ title, ...props }) {
  return (
    <div className={styles.card}>
      <div className={styles.card_head}>{title}</div>
      <Suspense
        fallback={<div className={styles.chart_empty}>Loading chart…</div>}
      >
        <TimeSeriesChart {...props} />
      </Suspense>
    </div>
  )
}
