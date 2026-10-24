import { useNavigate, useParams } from 'react-router-dom'
import classnames from 'classnames'
import SalesSection from './SalesSection'
import MintsSection from './MintsSection'
import MarketplaceSection from './MarketplaceSection'
import OverviewSection from './OverviewSection'
import ChannelStatsSection from './ChannelStatsSection'
import PollStatsSection from './PollStatsSection'
import TokenStatsSection from './TokenStatsSection'
import styles from '@style'

const TABS = [
  { key: 'sales', label: 'Sales' },
  { key: 'mints', label: 'Minting' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'channels', label: 'Channels & DMs' },
  { key: 'poll', label: 'Poll comments' },
  { key: 'token', label: 'Token comments' },
]

export default function StatsPage() {
  // The open tab lives in the address, so a view can be linked to.
  const { view } = useParams()
  const navigate = useNavigate()
  const tab = TABS.some((t) => t.key === view) ? view : 'sales'

  return (
    <div className={styles.stats}>
      <header className={styles.header}>
        <h2 className={styles.title}>Teia stats</h2>
      </header>

      <nav className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={classnames(styles.tab, {
              [styles.tab_active]: tab === t.key,
            })}
            onClick={() => navigate(`/dao/stats/${t.key}`)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={styles.panel}>
        {tab === 'sales' && <SalesSection />}
        {tab === 'mints' && <MintsSection />}
        {tab === 'marketplace' && <MarketplaceSection />}
        {tab === 'messaging' && <OverviewSection />}
        {tab === 'channels' && <ChannelStatsSection />}
        {tab === 'poll' && <PollStatsSection />}
        {tab === 'token' && <TokenStatsSection />}
      </div>
    </div>
  )
}
