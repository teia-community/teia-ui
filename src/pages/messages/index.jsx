import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import styles from './index.module.scss'

export default function MessagesInbox() {
  const address = useUserStore((st) => st.address)

  if (!address) {
    return (
      <Page title="Messages">
        <div className={styles.container}>
          <h2 className={styles.headline}>Messages</h2>
          <div style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>
            Connect your wallet to see your messages.
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Messages">
      <div className={styles.container}>
        <h2 className={styles.headline}>Messages</h2>

        <div className={styles.sections}>
          <Link to="/messages/dm" className={styles.sectionCard}>
            <h3>Direct Messages</h3>
            <p>Private conversations with other users</p>
          </Link>

          <Link to="/messages/channels" className={styles.sectionCard}>
            <h3>Channels</h3>
            <p>Public and private group chat rooms</p>
          </Link>

          <Link to="/messages/token-chat" className={styles.sectionCard}>
            <h3>Token Chat</h3>
            <p>Chat rooms gated by token ownership</p>
          </Link>
        </div>
      </div>
    </Page>
  )
}
