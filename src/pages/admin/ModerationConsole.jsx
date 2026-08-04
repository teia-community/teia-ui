import { useState } from 'react'
import classnames from 'classnames'
import { MODERATOR_CONTRACT, DAO_TREASURY_CONTRACT } from '@constants'
import { Page } from '@atoms/layout'
import { ModeratorManagement } from '@components/moderators'
import CommentsAdmin from './CommentsAdmin'
import ChannelsAdmin from './ChannelsAdmin'
import CalendarAdmin from './CalendarAdmin'
import styles from '@style'

const TABS = [
  { key: 'channels', label: 'Channels' },
  { key: 'poll', label: 'Poll comments' },
  { key: 'token', label: 'Token comments' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'moderators', label: 'Moderators' },
]

/**
 * Single moderation console for moderators + multisig users — the one place to
 * review channels, poll/token comments, calendar proposals and the moderator
 * set. Access is enforced by the RequireModerator route wrapper.
 */
export default function ModerationConsole() {
  const [tab, setTab] = useState('channels')

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
          {tab === 'calendar' && <CalendarAdmin />}
          {tab === 'moderators' && (
            <ModeratorManagement
              contract={MODERATOR_CONTRACT}
              multisig={DAO_TREASURY_CONTRACT}
              title="Teia moderators"
            />
          )}
        </div>
      </div>
    </Page>
  )
}
