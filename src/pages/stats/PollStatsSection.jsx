import { Link } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import StatCard from '@pages/admin/StatCard'
import { usePollStats } from '@data/messaging/stats'
import Chart from './Chart'
import Leaderboard from './Leaderboard'
import styles from '@style'

const POLL_COLOR = '#1d9e75'

export default function PollStatsSection() {
  const { data, error, isValidating } = usePollStats()

  if (!data) {
    if (error && !isValidating)
      return <p className={styles.muted}>Couldn’t load poll comment stats.</p>
    return <Loading message="Loading poll comment stats…" />
  }

  return (
    <div className={styles.section}>
      <div className={styles.stats_grid}>
        <StatCard label="Total comments" value={data.totalComments} />
        <StatCard label="Unique polls" value={data.uniquePolls} />
        <StatCard label="Unique commenters" value={data.uniqueCommenters} />
        <StatCard label="Edits" value={data.totalEdits} />
        <StatCard label="Currently hidden" value={data.currentlyHidden} />
        <StatCard
          label="Banned users"
          value={data.bannedCount}
          sublabel="ban-list size"
        />
      </div>

      <Chart
        title="Comments per week"
        data={data.weeklyPosts}
        xKey="week"
        series={[{ key: 'count', label: 'Posts', color: POLL_COLOR }]}
      />

      <div className={styles.two_col}>
        <Leaderboard
          title="Top commenters"
          entries={data.topCommenters}
          countLabel="comments"
        />
        <div className={styles.card}>
          <div className={styles.card_head}>Top polls</div>
          {data.topPolls.length === 0 ? (
            <div className={styles.card_empty}>No comments yet.</div>
          ) : (
            <ol className={styles.rank_list}>
              {data.topPolls.map((p, i) => (
                <li key={p.pollId} className={styles.rank_row}>
                  <span className={styles.rank_num}>{i + 1}.</span>
                  <Link to={`/poll/${p.pollId}`} className={styles.rank_name}>
                    Poll #{p.pollId}
                  </Link>
                  <span className={styles.rank_count}>
                    {p.count.toLocaleString()}{' '}
                    <span className={styles.muted}>comments</span>
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
