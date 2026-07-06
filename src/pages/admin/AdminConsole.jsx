import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import classnames from 'classnames'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { PATH } from '@constants'
import CommentsAdmin from './CommentsAdmin'
import ChannelsAdmin from './ChannelsAdmin'
import { useCanModerate } from './useCanModerate'
import styles from '@style'

const TABS = [
  { key: 'channels', label: 'Channels' },
  { key: 'poll', label: 'Poll comments' },
  { key: 'token', label: 'Token comments' },
]

/**
 * Unified moderation console for moderators + multisig users.
 * this is subject to change
 */
export default function AdminConsole() {
  const { canModerate, resolved } = useCanModerate()
  const [tab, setTab] = useState('channels')

  if (!resolved) {
    return (
      <Page title="Moderation">
        <Loading message="Checking permissions…" />
      </Page>
    )
  }

  if (!canModerate) return <Navigate to={PATH.FEED} replace />

  return (
    <Page title="Moderation">
      <div className={styles.admin}>
        <header className={styles.header}>
          <h1 className={styles.title}>Moderation</h1>
          <span className={styles.sub}>moderators + multisig users</span>
        </header>

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
          {tab === 'channels' && <ChannelsAdmin />}
          {tab === 'poll' && <CommentsAdmin kind="poll" />}
          {tab === 'token' && <CommentsAdmin kind="token" />}
        </div>
      </div>
    </Page>
  )
}
