import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import styles from '@style'

export default function TimeSeriesChart({
  data = [],
  xKey = 'week',
  series = [],
  height = 220,
  emptyHint = 'No data yet.',
}) {
  if (data.length === 0) {
    return <div className={styles.chart_empty}>{emptyHint}</div>
  }

  const stacked = series.length > 1

  return (
    <div className={styles.chart_body}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 6, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="2 3" stroke="var(--border-color)" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10, fill: 'var(--gray-60)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--gray-60)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--background-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--text-color)',
            }}
            labelStyle={{ color: 'var(--gray-60)' }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.15}
              strokeWidth={1.5}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
