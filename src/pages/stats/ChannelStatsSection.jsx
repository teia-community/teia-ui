import { Link } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import StatCard from '@pages/admin/StatCard'
import { useChannelStats } from '@data/messaging/stats'
import Chart from './Chart'
import Leaderboard from './Leaderboard'
import styles from '@style'

const CHANNEL_COLOR = '#8b5cf6'

export default function ChannelStatsSection() {
  const { data, error, isValidating } = useChannelStats()

  if (!data) {
    if (error && !isValidating)
      return <p className={styles.muted}>Couldn’t load channel stats.</p>
    return <Loading message="Loading channel stats…" />
  }

  return (
    <div className={styles.section}>
      <p className={styles.privacy_note}>
        Private and allowlist channels and DMs are counted in aggregate only
      </p>

      <div className={styles.stats_grid}>
        <StatCard label="Public channels" value={data.publicChannels} />
        <StatCard label="Private channels" value={data.privateChannels} />
        <StatCard label="DMs" value={data.dms} />
        <StatCard label="Total messages" value={data.totalMessages} />
        <StatCard
          label="Public messages"
          value={data.publicMessages}
          sublabel="shown in detail"
        />
        <StatCard
          label="Private / DM messages"
          value={data.privateMessages}
          sublabel="volume only"
        />
      </div>

      <Chart
        title="Messages per week — all channels"
        data={data.weeklyMessages}
        xKey="week"
        series={[{ key: 'count', label: 'Messages', color: CHANNEL_COLOR }]}
      />

      <div className={styles.two_col}>
        <Leaderboard
          title="Top public senders"
          entries={data.topPublicSenders}
          countLabel="messages"
        />
        <div className={styles.card}>
          <div className={styles.card_head}>Top public channels</div>
          {data.topPublicChannels.length === 0 ? (
            <div className={styles.card_empty}>No public channels yet.</div>
          ) : (
            <ol className={styles.rank_list}>
              {data.topPublicChannels.map((ch, i) => (
                <li key={ch.channelId} className={styles.rank_row}>
                  <span className={styles.rank_num}>{i + 1}.</span>
                  <Link
                    to={`/inbox/channels/${ch.channelId}`}
                    className={styles.rank_name}
                  >
                    {ch.name}
                  </Link>
                  <span className={styles.rank_count}>
                    {ch.count.toLocaleString()}{' '}
                    <span className={styles.muted}>messages</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
