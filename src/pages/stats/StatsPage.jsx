import { useState } from 'react'
import classnames from 'classnames'
import { DAO_TREASURY_CONTRACT } from '@constants'
import { useBalance, useDaoTokenBalance, useDaoMemberCount } from '@data/swr'
import { usePlatformTable } from '@data/platform-stats'
import StatCard from '@pages/admin/StatCard'
import OverviewSection from './OverviewSection'
import ChannelStatsSection from './ChannelStatsSection'
import PollStatsSection from './PollStatsSection'
import TokenStatsSection from './TokenStatsSection'
import PlatformSection from './PlatformSection'
import SalesSection from './SalesSection'
import styles from '@style'

const TABS = [
  { key: 'platform', label: 'Platform' },
  { key: 'overview', label: 'Messaging' },
  { key: 'channels', label: 'Channels & DMs' },
  { key: 'poll', label: 'Poll comments' },
  { key: 'token', label: 'Token comments' },
]

const mutezToTez = (v) => (v != null ? Math.round(v / 1e6) : undefined)

function HeadlineStats() {
  const { totals } = usePlatformTable()
  const [daoBalance] = useBalance(DAO_TREASURY_CONTRACT)
  const [daoTokenBalance] = useDaoTokenBalance(DAO_TREASURY_CONTRACT)
  const [daoMemberCount] = useDaoMemberCount(0)

  return (
    <div className={styles.stats_grid}>
      <StatCard label="OBJKTs minted" value={totals.mints} />
      <StatCard label="Artists" value={totals.artists} />
      <StatCard label="Sales" value={totals.sales} sublabel="Teia + HEN" />
      <StatCard
        label="Volume ꜩ"
        value={mutezToTez(totals.volumeMutez)}
        sublabel="Teia + HEN"
      />
      <StatCard
        label="Treasury ꜩ"
        value={daoBalance ? Math.round(daoBalance) : undefined}
        sublabel={
          daoTokenBalance
            ? `${Math.round(daoTokenBalance).toLocaleString()} TEIA`
            : undefined
        }
      />
      <StatCard label="DAO members" value={daoMemberCount} />
    </div>
  )
}

export default function StatsPage() {
  const [tab, setTab] = useState('platform')

  return (
    <div className={styles.stats}>
      <header className={styles.header}>
        <h2 className={styles.title}>Stats</h2>
      </header>

      <HeadlineStats />

      <nav className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={classnames(styles.tab, {
              [styles.tab_active]: tab === t.key,
            })}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={styles.panel}>
        {tab === 'platform' && (
          <>
            <SalesSection />
            <PlatformSection />
          </>
        )}
        {tab === 'overview' && <OverviewSection />}
        {tab === 'channels' && <ChannelStatsSection />}
        {tab === 'poll' && <PollStatsSection />}
        {tab === 'token' && <TokenStatsSection />}
      </div>
    </div>
  )
}
