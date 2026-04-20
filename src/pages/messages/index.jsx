import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { useUserStore } from '@context/userStore'
import { MESSAGING_TZKT_API } from '@constants'
import styles from './index.module.scss'

const SHADOWNET_RPC = 'https://rpc.shadownet.teztnets.com'
const SHADOWNET_TZKT = MESSAGING_TZKT_API

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

        <div className={styles.info}>
          <p>
            This is an isolated testing environment connected to the Tezos
            Shadownet.
          </p>
          <p>Contracts deployed here use test tez and do not affect mainnet.</p>
          <p>
            <strong>Get shadownet tez:</strong>{' '}
            <a
              href="https://faucet.shadownet.teztnets.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.faucetLink}
            >
              https://faucet.shadownet.teztnets.com/
            </a>
          </p>
          <p>
            <strong>RPC:</strong> <code>{SHADOWNET_RPC}</code>
          </p>
          <p>
            <strong>TzKT:</strong> <code>{SHADOWNET_TZKT}</code>
          </p>
        </div>

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
