import { Link } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { walletPreview } from '@utils/string'
import StatCard from '@pages/admin/StatCard'
import { useTokenStats } from '@data/messaging/stats'
import Chart from './Chart'
import Leaderboard from './Leaderboard'
import styles from '@style'

const TOKEN_COLOR = '#1a73e8'

export default function TokenStatsSection() {
  const { data, error, isValidating } = useTokenStats()

  if (!data) {
    if (error && !isValidating)
      return <p className={styles.muted}>Couldn’t load token comment stats.</p>
    return <Loading message="Loading token comment stats…" />
  }

  return (
    <div className={styles.section}>
      <div className={styles.stats_grid}>
        <StatCard label="Total comments" value={data.totalComments} />
        <StatCard label="Unique tokens" value={data.uniqueTokens} />
        <StatCard label="FA2 contracts" value={data.uniqueFa2Contracts} />
        <StatCard label="Unique commenters" value={data.uniqueCommenters} />
        <StatCard label="Edits" value={data.totalEdits} />
        <StatCard label="Currently hidden" value={data.currentlyHidden} />
      </div>

      <Chart
        title="Comments per week"
        data={data.weeklyPosts}
        xKey="week"
        series={[{ key: 'count', label: 'Posts', color: TOKEN_COLOR }]}
      />

      <div className={styles.two_col}>
        <Leaderboard
          title="Top commenters"
          entries={data.topCommenters}
          countLabel="comments"
        />
        <div className={styles.card}>
          <div className={styles.card_head}>Top tokens</div>
          {data.topTokens.length === 0 ? (
            <div className={styles.card_empty}>No comments yet.</div>
          ) : (
            <ol className={styles.rank_list}>
              {data.topTokens.map((t, i) => (
                <li
                  key={`${t.fa2Address}:${t.tokenId}`}
                  className={styles.rank_row}
                >
                  <span className={styles.rank_num}>{i + 1}.</span>
                  <Link
                    to={`/objkt/${t.tokenId}/comments`}
                    className={styles.rank_name}
                    title={`${t.fa2Address}:${t.tokenId}`}
                  >
                    OBJKT #{t.tokenId}
                  </Link>
                  <span className={styles.rank_count}>
                    {t.count.toLocaleString()}{' '}
                    <span className={styles.muted}>comments</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.card_head}>Top FA2 contracts</div>
        {data.topFa2Contracts.length === 0 ? (
          <div className={styles.card_empty}>No comments yet.</div>
        ) : (
          <ol className={styles.rank_list}>
            {data.topFa2Contracts.map((f, i) => (
              <li key={f.fa2Address} className={styles.rank_row}>
                <span className={styles.rank_num}>{i + 1}.</span>
                <span className={`${styles.rank_name} ${styles.mono}`}>
                  {walletPreview(f.fa2Address)}
                </span>
                <span className={styles.rank_count}>
                  {f.count.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
