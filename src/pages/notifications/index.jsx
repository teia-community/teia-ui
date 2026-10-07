import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bytesToString } from '@taquito/utils'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { POLLS_CONTRACT } from '@constants'
import { HashToURL } from '@utils'
import { getTimeAgo } from '@utils/time'
import useActivityFilter from '@hooks/use-activity-filter'
import { useUserStore } from '@context/userStore'
import { useLocalSettings } from '@context/localSettingsStore'
import {
  useChatReadStore,
  useUnreadChannels,
  useUnreadItems,
} from '@context/chatReadStore'
import { useMyInbox, useChannelLatestActivity } from '@data/messaging/channels'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { useMyPollNotificationActivity } from '@data/messaging/poll-comments'
import { useMyTokenNotificationActivity } from '@data/messaging/token-comments'
import { toLatestIds } from '@data/messaging/notification-activity'
import { useUsers, useObjktsByIds, useStorage, usePolls } from '@data/swr'
import { walletPreview } from '@utils/string'
import { ActivityBadge, ActivityFilters } from '@components/activity'
import CreateChannelModal from '@components/channels/CreateChannelModal'
import CreateDmModal from '@components/channels/CreateDmModal'
import styles from './index.module.scss'

const NOTIFICATION_FILTERS = [
  { key: 'dm', label: 'DMs' },
  { key: 'channel', label: 'Channels' },
  { key: 'poll', label: 'Polls' },
  { key: 'token', label: 'Artwork' },
]

const KIND_META = {
  dm: { label: 'DM', color: 'channel', sub: 'Direct message' },
  channel: { label: 'Channel', color: 'channel', sub: 'New message' },
  poll: { label: 'Poll', color: 'poll', sub: 'Comment on your poll' },
  token: { label: 'Artwork', color: 'token', sub: 'Comment on your artwork' },
}

/** One notification, whatever it came from. */
function NotificationRow({ item }) {
  const meta = KIND_META[item.kind]

  return (
    <Link
      to={item.to}
      className={`${styles.row} ${item.unread ? styles.unread : styles.read}`}
    >
      <span className={styles.dotCell}>
        {item.unread && <span className={styles.unreadDot} />}
      </span>
      <ActivityBadge color={meta.color} label={meta.label} />
      {item.thumb}
      <div className={styles.rowBody}>
        <span className={styles.rowTitle}>{item.title}</span>
        <span className={styles.rowSub}>{meta.sub}</span>
      </div>
      <span className={styles.rowTime}>
        {item.timestamp ? getTimeAgo(item.timestamp) : ''}
      </span>
    </Link>
  )
}

/**
 * Aggregated notifications centre: one list, newest first, across DMs,
 * channels, poll comments and comments on your artwork.
 *
 * The sources are separate contracts whose ids cannot be compared with one
 * another, so rows are ordered by the timestamp each scan already carries.
 */
export default function NotificationsCenter() {
  const address = useUserStore((st) => st.address)
  const messageNotifications = useLocalSettings((s) => s.messageNotifications)
  const notifAddress = messageNotifications ? address : undefined

  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showCreateDm, setShowCreateDm] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const kind = useActivityFilter()

  // --- Channels / DMs ---
  const { data: inbox, isLoading: loadingInbox } = useMyInbox(notifAddress)
  const inboxIds = useMemo(() => (inbox ?? []).map((c) => c.id), [inbox])
  const { data: channelActivity } = useChannelLatestActivity(
    inboxIds.length > 0
  )
  const latestIds = useMemo(() => {
    if (!channelActivity) return undefined
    const wanted = new Set(inboxIds)
    return Object.fromEntries(
      Object.entries(channelActivity)
        .filter(([cid]) => wanted.has(cid))
        .map(([cid, v]) => [cid, v.messageId])
    )
  }, [channelActivity, inboxIds])
  const { unread: unreadChannels } = useUnreadChannels(notifAddress, latestIds)

  // --- Poll comments ---
  const { data: pollActivity } = useMyPollNotificationActivity(notifAddress)
  const pollMap = useMemo(() => toLatestIds(pollActivity), [pollActivity])
  const { unread: unreadPolls } = useUnreadItems(
    notifAddress,
    'poll-comments',
    pollMap
  )
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls] = usePolls(pollsStorage)

  // --- Token comments ---
  const { data: tokenActivity } = useMyTokenNotificationActivity(notifAddress)
  const tokenMap = useMemo(() => toLatestIds(tokenActivity), [tokenActivity])
  const { unread: unreadTokens } = useUnreadItems(
    notifAddress,
    'token-comments',
    tokenMap
  )

  // Resolve DM peer aliases for every DM in the inbox (log shows read too).
  const peerAddresses = useMemo(() => {
    const set = new Set()
    for (const ch of inbox ?? []) {
      if (ch.metadata.kind === 'dm') {
        const peer = (ch.metadata.participants ?? []).find((a) => a !== address)
        if (peer) set.add(peer)
      }
    }
    return [...set]
  }, [inbox, address])
  const [users] = useUsers(peerAddresses)

  const tokenIds = useMemo(
    () =>
      Object.keys(tokenActivity ?? {}).map((k) => k.slice(k.indexOf(':') + 1)),
    [tokenActivity]
  )
  const tokens = useObjktsByIds(tokenIds)

  // Every source, flattened into rows that can be sorted against each other.
  const items = useMemo(() => {
    const rows = []

    for (const ch of inbox ?? []) {
      const activity = channelActivity?.[ch.id]
      const isDm = ch.metadata.kind === 'dm'
      const peer = isDm
        ? (ch.metadata.participants ?? []).find((a) => a !== address)
        : undefined

      rows.push({
        key: `${isDm ? 'dm' : 'channel'}:${ch.id}`,
        kind: isDm ? 'dm' : 'channel',
        to: `/inbox/channels/${ch.id}`,
        timestamp: activity?.timestamp ?? null,
        unread: Boolean(unreadChannels[ch.id]),
        title: isDm
          ? users?.[peer]?.alias ||
            (peer ? walletPreview(peer) : ch.metadata.name || 'DM')
          : ch.metadata.name || `Channel #${ch.id}`,
        thumb: isDm ? (
          <Identicon
            address={peer}
            logo={users?.[peer]?.logo}
            className={styles.thumb}
          />
        ) : ch.metadata?.image ? (
          <img
            src={msgIpfsToUrl(ch.metadata.image)}
            alt=""
            className={styles.thumb}
          />
        ) : (
          <div className={styles.thumbFallback}>#</div>
        ),
      })
    }

    for (const [pollId, activity] of Object.entries(pollActivity ?? {})) {
      const question = polls?.[pollId]?.question
      rows.push({
        key: `poll:${pollId}`,
        kind: 'poll',
        to: `/poll/${pollId}`,
        timestamp: activity.timestamp,
        unread: Boolean(unreadPolls[pollId]),
        title: question ? bytesToString(question) : `Poll #${pollId}`,
        thumb: <div className={styles.thumbFallback}>#{pollId}</div>,
      })
    }

    for (const [tokenKey, activity] of Object.entries(tokenActivity ?? {})) {
      const tokenId = tokenKey.slice(tokenKey.indexOf(':') + 1)
      const token = tokens[tokenId]
      const cover = token?.display_uri
        ? HashToURL(token.display_uri, 'CDN', { size: 'small' })
        : token?.thumbnail_uri
        ? HashToURL(token.thumbnail_uri, 'CDN', { size: 'small' })
        : null

      rows.push({
        key: `token:${tokenKey}`,
        kind: 'token',
        to: `/objkt/${tokenId}/comments`,
        timestamp: activity.timestamp,
        unread: Boolean(unreadTokens[tokenKey]),
        title: token?.name || `OBJKT #${tokenId}`,
        thumb: cover ? (
          <img src={cover} alt="" className={styles.thumb} loading="lazy" />
        ) : (
          <div className={styles.thumbFallback}>#{tokenId}</div>
        ),
      })
    }

    // Anything without a timestamp yet sorts last rather than jumping to the
    // top, so a slow source cannot push fresh rows down the page.
    return rows.sort((a, b) => {
      if (!a.timestamp) return 1
      if (!b.timestamp) return -1
      return new Date(b.timestamp) - new Date(a.timestamp)
    })
  }, [
    inbox,
    channelActivity,
    unreadChannels,
    users,
    address,
    pollActivity,
    unreadPolls,
    polls,
    tokenActivity,
    unreadTokens,
    tokens,
  ])

  const unreadCount = useMemo(
    () => items.filter((i) => i.unread).length,
    [items]
  )

  const visible = useMemo(
    () =>
      items.filter((i) => kind.matches(i.kind) && (!unreadOnly || i.unread)),
    [items, kind, unreadOnly]
  )

  // Mark every notification as read
  const markRead = useChatReadStore((st) => st.markRead)
  const handleMarkAllRead = useCallback(() => {
    if (!address) return
    for (const [id, latest] of Object.entries(latestIds ?? {})) {
      markRead(address, `channel:${id}`, latest)
    }
    for (const [pollId, latest] of Object.entries(pollMap ?? {})) {
      markRead(address, `poll-comments:${pollId}`, latest)
    }
    for (const [tokenKey, latest] of Object.entries(tokenMap ?? {})) {
      markRead(address, `token-comments:${tokenKey}`, latest)
    }
  }, [address, latestIds, pollMap, tokenMap, markRead])

  if (!address) {
    return (
      <Page title="Notifications">
        <div className={styles.container}>
          <h2 className={styles.headline}>Notifications</h2>
          <div className={styles.empty}>
            Connect your wallet to see your notifications.
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Notifications">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.headline}>Notifications</h2>
          {messageNotifications && unreadCount > 0 && (
            <span className={styles.totalBadge}>{unreadCount}</span>
          )}
          <div className={styles.headerActions}>
            <Button
              shadow_box
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>
        </div>

        <div className={styles.secondaryActions}>
          <button type="button" onClick={() => setShowCreateChannel(true)}>
            Create channel
          </button>
          <button type="button" onClick={() => setShowCreateDm(true)}>
            New DM
          </button>
          <Link to="/inbox/channels">Browse all channels</Link>
        </div>

        <details className={styles.infoNote}>
          <summary>
            Read status is kept on this device, and messages are public on-chain
          </summary>
          <p>
            Read/unread status is stored on this device only. If you open Teia
            in another browser or on another computer, items may appear unread
            again — your messages and comments themselves are safe and stored
            on-chain.
          </p>
          <p>
            Messages, direct messages and comments are currently stored
            unencrypted on the Tezos blockchain. That means their contents are
            publicly readable on-chain by anyone. Treat them as public and
            don&apos;t share anything private or sensitive.
          </p>
        </details>

        {!messageNotifications && (
          <div className={styles.empty}>
            Notifications are turned off in your settings.
          </div>
        )}

        {messageNotifications && (
          <>
            <div className={styles.controls}>
              <ActivityFilters
                active={kind.active}
                onToggle={kind.toggle}
                filters={NOTIFICATION_FILTERS}
              />
              <button
                type="button"
                className={`${styles.unreadToggle} ${
                  unreadOnly ? styles.unreadToggleActive : ''
                }`}
                onClick={() => setUnreadOnly((on) => !on)}
              >
                Unread only
              </button>
            </div>

            {loadingInbox && items.length === 0 && <Loading />}

            {items.length === 0 && !loadingInbox && (
              <div className={styles.empty}>You have no notifications yet.</div>
            )}

            {items.length > 0 && visible.length === 0 && (
              <div className={styles.empty}>
                Nothing here with those filters.
              </div>
            )}

            <div className={styles.list}>
              {visible.map((item) => (
                <NotificationRow key={item.key} item={item} />
              ))}
            </div>
          </>
        )}
      </div>

      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
      />
      <CreateDmModal
        isOpen={showCreateDm}
        onClose={() => setShowCreateDm(false)}
        inbox={inbox}
      />
    </Page>
  )
}
