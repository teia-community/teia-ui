import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useMyInbox } from '@data/messaging/channels'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import UserSearchDropdown from '@components/shared/UserSearchDropdown'
import { MESSAGING_TZKT_API } from '@constants'
import styles from './index.module.scss'

const SHADOWNET_RPC = 'https://rpc.shadownet.teztnets.com'
const SHADOWNET_TZKT = MESSAGING_TZKT_API

function InboxCard({ item, viewer }) {
  const isDm = item.metadata.kind === 'dm'
  const peer = isDm
    ? (item.metadata.participants ?? []).find((a) => a !== viewer)
    : null
  const title = isDm
    ? peer
      ? walletPreview(peer)
      : item.metadata.name || 'DM'
    : item.metadata.name || `Channel #${item.id}`

  return (
    <Link to={`/messages/channels/${item.id}`} className={styles.channelCard}>
      {item.metadata?.image ? (
        <img
          src={msgIpfsToUrl(item.metadata.image)}
          alt=""
          className={styles.channelImage}
        />
      ) : (
        <div className={styles.channelImagePlaceholder}>
          {(title || '#')[0].toUpperCase()}
        </div>
      )}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <span className={styles.channelName}>{title}</span>
          <span className={styles.cardTime}>{getTimeAgo(item.createdAt)}</span>
        </div>
        {!isDm && item.metadata?.description && (
          <div className={styles.channelDesc}>{item.metadata.description}</div>
        )}
        <div className={styles.cardMeta}>
          <span style={{ fontSize: '11px', opacity: 0.5 }}>
            {item.isCreator ? 'creator' : 'admin'}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function MessagesInbox() {
  const address = useUserStore((st) => st.address)
  const navigate = useNavigate()
  const { data: inbox, isLoading } = useMyInbox(address)

  const [dmInput, setDmInput] = useState('')
  const [showDmSearch, setShowDmSearch] = useState(false)
  const dmInputRef = useRef(null)

  useEffect(() => {
    if (showDmSearch) dmInputRef.current?.focus()
  }, [showDmSearch])

  const startDm = (peer) => {
    if (!peer) return
    navigate(`/messages/dm/${peer}`)
  }

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

  const dms = (inbox ?? []).filter((c) => c.metadata.kind === 'dm')
  const channels = (inbox ?? []).filter((c) => c.metadata.kind !== 'dm')

  return (
    <Page title="Messages">
      <div className={styles.container}>
        <h2 className={styles.headline}>Messages</h2>

        <div className={styles.info}>
          <p>
            Shadownet test environment.{' '}
            <a
              href="https://faucet.shadownet.teztnets.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.faucetLink}
            >
              Get test tez
            </a>
            . RPC: <code>{SHADOWNET_RPC}</code> · TzKT:{' '}
            <code>{SHADOWNET_TZKT}</code>
          </p>
        </div>

        <div className={styles.sections}>
          <button
            type="button"
            className={styles.sectionCard}
            onClick={() => setShowDmSearch((s) => !s)}
          >
            <h3>Direct Messages</h3>
            <p>Private conversations with other users</p>
          </button>

          <Link to="/messages/channels" className={styles.sectionCard}>
            <h3>Channels</h3>
            <p>Public and private group chat rooms</p>
          </Link>

          <Link to="/messages/token-chat" className={styles.sectionCard}>
            <h3>Token Chat</h3>
            <p>Chat rooms gated by token ownership</p>
          </Link>
        </div>

        {showDmSearch && (
          <div className={styles.dmSearch}>
            <input
              type="text"
              placeholder="Recipient address or name"
              value={dmInput}
              onChange={(e) => setDmInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && dmInput.startsWith('tz')) {
                  startDm(dmInput.trim())
                }
              }}
              className={styles.dmInputField}
              ref={dmInputRef}
            />
            {dmInput.length >= 2 && !dmInput.startsWith('tz') && (
              <UserSearchDropdown
                query={dmInput}
                onSelect={(user) => {
                  setShowDmSearch(false)
                  setDmInput('')
                  startDm(user.user_address)
                }}
                onClose={() => setShowDmSearch(false)}
              />
            )}
          </div>
        )}

        <div className={styles.actionsRow}>
          <Link to="/messages/channels/create">
            <Button shadow_box>New Channel</Button>
          </Link>
        </div>

        {isLoading && <Loading />}

        <h3 className={styles.sectionTitle}>Direct Messages</h3>
        <div className={styles.list}>
          {dms.map((item) => (
            <InboxCard key={item.id} item={item} viewer={address} />
          ))}
          {!isLoading && dms.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
              No DMs yet. Click "Direct Messages" above to start one.
            </div>
          )}
        </div>

        <h3 className={styles.sectionTitle}>Channels</h3>
        <div className={styles.list}>
          {channels.map((item) => (
            <InboxCard key={item.id} item={item} viewer={address} />
          ))}
          {!isLoading && channels.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
              You're not in any channels yet.
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
