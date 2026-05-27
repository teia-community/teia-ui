import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { useUserStore } from '@context/userStore'
import { useUnreadChannels } from '@context/chatReadStore'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import {
  useChannelList,
  useMyInbox,
  useChannelLatestMessageIds,
} from '@data/messaging/channels'
import { useUsers } from '@data/swr'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import UserSearchDropdown from '@components/shared/UserSearchDropdown'
import AccessBadge from '@components/channels/AccessBadge'
import styles from './index.module.scss'

function InboxRow({ item, viewer, users, hasUnread }) {
  const isDm = item.metadata.kind === 'dm'
  const peer = isDm
    ? (item.metadata.participants ?? []).find((a) => a !== viewer)
    : null

  const peerUser = peer ? users[peer] : undefined
  const creatorUser = !isDm && item.creator ? users[item.creator] : undefined

  const title = isDm
    ? peerUser?.alias ||
      (peer ? walletPreview(peer) : item.metadata.name || 'DM')
    : item.metadata.name || `Channel #${item.id}`

  return (
    <Link to={`/inbox/channels/${item.id}`} className={styles.row}>
      {hasUnread && <span className={styles.unreadDot} />}
      {isDm ? (
        <Identicon
          address={peer}
          logo={peerUser?.logo}
          className={styles.avatar}
        />
      ) : item.metadata?.image ? (
        <img
          src={msgIpfsToUrl(item.metadata.image)}
          alt=""
          className={styles.avatar}
        />
      ) : (
        <div className={styles.avatarFallback}>#</div>
      )}
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={styles.rowTitle}>{title}</span>
          <span className={styles.rowTime}>{getTimeAgo(item.createdAt)}</span>
        </div>
        {!isDm && item.metadata?.description && (
          <div className={styles.rowSub}>{item.metadata.description}</div>
        )}
        {!isDm && (
          <div className={styles.rowMeta}>
            <AccessBadge mode={item.accessMode} />
            {item.creator && (
              <span className={styles.rowCreator}>
                {creatorUser?.alias || walletPreview(item.creator)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function MessagesInbox() {
  const address = useUserStore((st) => st.address)
  const navigate = useNavigate()
  const { data: inbox, isLoading: loadingInbox } = useMyInbox(address)
  const { data: allChannels, isLoading: loadingAll } = useChannelList()

  const [activeTab, setActiveTab] = useState('channels')
  const [channelFilter, setChannelFilter] = useState('all')
  const [dmInput, setDmInput] = useState('')
  const dmInputRef = useRef(null)

  useEffect(() => {
    if (activeTab === 'dm') dmInputRef.current?.focus()
  }, [activeTab])

  const startDm = (peer) => {
    if (!peer) return
    navigate(`/inbox/dm/${peer}`)
  }

  const dms = useMemo(
    () => (inbox ?? []).filter((c) => c.metadata.kind === 'dm'),
    [inbox]
  )
  const myChannels = useMemo(
    () => (inbox ?? []).filter((c) => c.metadata.kind !== 'dm'),
    [inbox]
  )

  const openChannels = useMemo(
    () => (allChannels ?? []).filter((c) => c.accessMode === 'unrestricted'),
    [allChannels]
  )

  const displayedChannels = channelFilter === 'my' ? myChannels : openChannels
  const channelsLoading = channelFilter === 'my' ? loadingInbox : loadingAll

  const lookupAddresses = useMemo(() => {
    const set = new Set()
    for (const dm of dms) {
      const peer = (dm.metadata.participants ?? []).find((a) => a !== address)
      if (peer) set.add(peer)
    }
    for (const ch of displayedChannels) {
      if (ch.creator) set.add(ch.creator)
    }
    return [...set]
  }, [dms, displayedChannels, address])

  const [users] = useUsers(lookupAddresses)

  const allInboxIds = useMemo(() => (inbox ?? []).map((c) => c.id), [inbox])
  const { data: latestIds } = useChannelLatestMessageIds(allInboxIds)
  const { unread, total: totalUnread } = useUnreadChannels(address, latestIds)

  const unreadDmCount = useMemo(
    () => dms.filter((d) => unread[d.id]).length,
    [dms, unread]
  )
  const unreadChannelCount = useMemo(
    () => myChannels.filter((c) => unread[c.id]).length,
    [myChannels, unread]
  )

  if (!address) {
    return (
      <Page title="Inbox">
        <div className={styles.container}>
          <h2 className={styles.headline}>Inbox</h2>
          <div className={styles.emptyState}>
            Connect your wallet to see your messages.
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Inbox">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.headline}>Inbox</h2>
          <Link to="/inbox/channels/create">
            <Button shadow_box>Create Channel</Button>
          </Link>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${
              activeTab === 'channels' ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab('channels')}
            aria-pressed={activeTab === 'channels'}
          >
            <h3>
              Channels
              {unreadChannelCount > 0 && (
                <span className={styles.tabBadge}>{unreadChannelCount}</span>
              )}
            </h3>
            <p>Public and private group chat rooms</p>
          </button>

          <button
            type="button"
            className={`${styles.tab} ${
              activeTab === 'dm' ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab('dm')}
            aria-pressed={activeTab === 'dm'}
          >
            <h3>
              Direct Messages
              {unreadDmCount > 0 && (
                <span className={styles.tabBadge}>{unreadDmCount}</span>
              )}
            </h3>
            <p>Private conversations with other users</p>
          </button>
        </div>

        {activeTab === 'channels' && (
          <>
            <div className={styles.subTabs}>
              <Button
                shadow_box
                selected={channelFilter === 'all'}
                onClick={() => setChannelFilter('all')}
              >
                All
              </Button>
              <Button
                shadow_box
                selected={channelFilter === 'my'}
                onClick={() => setChannelFilter('my')}
              >
                My Channels
              </Button>
            </div>

            {channelsLoading && <Loading />}

            <div className={styles.list}>
              {displayedChannels.map((ch) => (
                <InboxRow
                  key={ch.id}
                  item={ch}
                  viewer={address}
                  users={users}
                  hasUnread={unread[ch.id]}
                />
              ))}
              {!channelsLoading && displayedChannels.length === 0 && (
                <div className={styles.emptyRow}>
                  {channelFilter === 'my'
                    ? "You're not in any channels yet."
                    : 'No channels found.'}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'dm' && (
          <>
            <div className={styles.compose}>
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
                className={styles.composeInput}
                ref={dmInputRef}
              />
              {dmInput.length >= 2 && !dmInput.startsWith('tz') && (
                <UserSearchDropdown
                  query={dmInput}
                  onSelect={(user) => {
                    setDmInput('')
                    startDm(user.user_address)
                  }}
                  onClose={() => setDmInput('')}
                />
              )}
            </div>

            {loadingInbox && <Loading />}

            <div className={styles.list}>
              {dms.map((item) => (
                <InboxRow
                  key={item.id}
                  item={item}
                  viewer={address}
                  users={users}
                  hasUnread={unread[item.id]}
                />
              ))}
              {!loadingInbox && dms.length === 0 && (
                <div className={styles.emptyRow}>
                  No DMs yet. Enter a recipient above to start one.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Page>
  )
}
