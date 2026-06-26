import { useMemo } from 'react'
import { Loading } from '@atoms/loading'
import StatCard from '@pages/admin/StatCard'
import {
  usePollStats,
  useTokenStats,
  useChannelStats,
} from '@data/messaging/stats'
import Chart from './Chart'
import styles from '@style'

const POLL_COLOR = '#1d9e75'
const TOKEN_COLOR = '#1a73e8'
const CHANNEL_COLOR = '#8b5cf6'

/** Merge the three weekly series into one array keyed by week. */
function mergeWeekly(poll, token, channel) {
  const byWeek = new Map()
  const add = (buckets, key) => {
    for (const b of buckets ?? []) {
      const row = byWeek.get(b.week) ?? {
        week: b.week,
        poll: 0,
        token: 0,
        messages: 0,
      }
      row[key] += b.count
      byWeek.set(b.week, row)
    }
  }
  add(poll, 'poll')
  add(token, 'token')
  add(channel, 'messages')
  return Array.from(byWeek.values()).sort((a, b) => (a.week < b.week ? -1 : 1))
}

export default function OverviewSection() {
  const poll = usePollStats()
  const token = useTokenStats()
  const channel = useChannelStats()

  const weekly = useMemo(
    () =>
      mergeWeekly(
        poll.data?.weeklyPosts,
        token.data?.weeklyPosts,
        channel.data?.weeklyMessages
      ),
    [poll.data, token.data, channel.data]
  )

  // Hold the spinner until all three sources have data. Don't flash partial
  // zeros as they resolve, and keep spinning through transient rate-limit
  // retries (isValidating); only show an error once all have given up.
  const allReady = poll.data && token.data && channel.data
  if (!allReady) {
    const stillTrying =
      poll.isValidating || token.isValidating || channel.isValidating
    const anyError = poll.error || token.error || channel.error
    if (anyError && !stillTrying) {
      return <p className={styles.muted}>Couldn’t load messaging stats.</p>
    }
    return <Loading message="Loading messaging stats…" />
  }

  const pollData = poll.data
  const tokenData = token.data
  const channelData = channel.data

  return (
    <div className={styles.section}>
      <div className={styles.stats_grid}>
        <StatCard label="Poll comments" value={pollData.totalComments} />
        <StatCard label="Token comments" value={tokenData.totalComments} />
        <StatCard label="Channel messages" value={channelData.totalMessages} />
        <StatCard label="Public channels" value={channelData.publicChannels} />
        <StatCard label="DMs" value={channelData.dms} />
        <StatCard
          label="Total edits"
          value={pollData.totalEdits + tokenData.totalEdits}
          sublabel="poll + token"
        />
      </div>

      <Chart
        title="Activity per week"
        data={weekly}
        xKey="week"
        height={260}
        series={[
          { key: 'poll', label: 'Poll comments', color: POLL_COLOR },
          { key: 'token', label: 'Token comments', color: TOKEN_COLOR },
          { key: 'messages', label: 'Channel messages', color: CHANNEL_COLOR },
        ]}
      />
    </div>
  )
}
