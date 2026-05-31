import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { bytesToString } from '@taquito/utils'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { POLLS_CONTRACT } from '@constants'
import { HashToURL } from '@utils'
import { useUserStore } from '@context/userStore'
import { useLocalSettings } from '@context/localSettingsStore'
import { useUnreadChannels, useUnreadItems } from '@context/chatReadStore'
import {
  useMyInbox,
  useChannelLatestMessageIds,
} from '@data/messaging/channels'
import { useMyPollNotifications } from '@data/messaging/poll-comments'
import { useMyTokenNotifications } from '@data/messaging/token-comments'
import { useUsers, useObjktsByIds, useStorage, usePolls } from '@data/swr'
import { walletPreview } from '@utils/string'
import styles from './index.module.scss'

function TokenRow({ tokenId, token }) {
  const cover = token?.display_uri
    ? HashToURL(token.display_uri, 'CDN', { size: 'small' })
    : token?.thumbnail_uri
    ? HashToURL(token.thumbnail_uri, 'CDN', { size: 'small' })
    : null

  return (
    <Link to={`/objkt/${tokenId}/comments`} className={styles.row}>
      <span className={styles.unreadDot} />
      {cover ? (
        <img src={cover} alt="" className={styles.thumb} loading="lazy" />
      ) : (
        <div className={styles.thumbFallback}>#{tokenId}</div>
      )}
      <div className={styles.rowBody}>
        <span className={styles.rowTitle}>
          {token?.name || `OBJKT #${tokenId}`}
        </span>
        <span className={styles.rowSub}>New comment on your artwork</span>
      </div>
    </Link>
  )
}

/**
 * Aggregated notifications center. Lists every unread item across DMs/channels,
 * poll comments, and token comments, with a deep-link to its source.
 */
export default function NotificationsCenter() {
  const address = useUserStore((st) => st.address)
  const messageNotifications = useLocalSettings((s) => s.messageNotifications)
  const notifAddress = messageNotifications ? address : undefined

  // --- Channels / DMs ---
  const { data: inbox, isLoading: loadingInbox } = useMyInbox(notifAddress)
  const inboxIds = useMemo(() => (inbox ?? []).map((c) => c.id), [inbox])
  const { data: latestIds } = useChannelLatestMessageIds(inboxIds)
  const { unread: unreadChannels } = useUnreadChannels(notifAddress, latestIds)

  // --- Poll comments ---
  const { data: pollMap } = useMyPollNotifications(notifAddress)
  const { unread: unreadPolls } = useUnreadItems(
    notifAddress,
    'poll-comments',
    pollMap
  )
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls] = usePolls(pollsStorage)

  // --- Token comments ---
  const { data: tokenMap } = useMyTokenNotifications(notifAddress)
  const { unread: unreadTokens } = useUnreadItems(
    notifAddress,
    'token-comments',
    tokenMap
  )

  // Resolve DM peer aliases.
  const peerAddresses = useMemo(() => {
    const set = new Set()
    for (const ch of inbox ?? []) {
      if (!unreadChannels[ch.id]) continue
      if (ch.metadata.kind === 'dm') {
        const peer = (ch.metadata.participants ?? []).find((a) => a !== address)
        if (peer) set.add(peer)
      }
    }
    return [...set]
  }, [inbox, unreadChannels, address])
  const [users] = useUsers(peerAddresses)

  const channelItems = useMemo(() => {
    return (inbox ?? [])
      .filter((ch) => unreadChannels[ch.id])
      .map((ch) => {
        const isDm = ch.metadata.kind === 'dm'
        const peer = isDm
          ? (ch.metadata.participants ?? []).find((a) => a !== address)
          : null
        const title = isDm
          ? users?.[peer]?.alias ||
            (peer ? walletPreview(peer) : ch.metadata.name || 'DM')
          : ch.metadata.name || `Channel #${ch.id}`
        return {
          key: `channel:${ch.id}`,
          to: `/inbox/channels/${ch.id}`,
          peer: isDm ? peer : null,
          peerLogo: isDm ? users?.[peer]?.logo : undefined,
          channelImage: !isDm ? ch.metadata?.image : null,
          title,
          subtitle: isDm ? 'New direct message' : 'New message in channel',
        }
      })
  }, [inbox, unreadChannels, users, address])

  const pollIds = useMemo(() => Object.keys(unreadPolls), [unreadPolls])
  const tokenKeys = useMemo(() => Object.keys(unreadTokens), [unreadTokens])

  // Resolve every unread token's info in one batched query (avoids N+1).
  const tokenIds = useMemo(
    () => tokenKeys.map((k) => k.slice(k.indexOf(':') + 1)),
    [tokenKeys]
  )
  const tokens = useObjktsByIds(tokenIds)

  const totalCount = channelItems.length + pollIds.length + tokenKeys.length

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
          {messageNotifications && totalCount > 0 && (
            <span className={styles.totalBadge}>{totalCount}</span>
          )}
        </div>

        {!messageNotifications && (
          <div className={styles.empty}>
            Notifications are turned off in your settings.
          </div>
        )}

        {messageNotifications && loadingInbox && totalCount === 0 && (
          <Loading />
        )}

        {messageNotifications && totalCount === 0 && !loadingInbox && (
          <div className={styles.empty}>🎉 You&apos;re all caught up.</div>
        )}

        {messageNotifications && channelItems.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Messages</h3>
            <div className={styles.list}>
              {channelItems.map((item) => (
                <Link key={item.key} to={item.to} className={styles.row}>
                  <span className={styles.unreadDot} />
                  {item.peer ? (
                    <Identicon
                      address={item.peer}
                      logo={item.peerLogo}
                      className={styles.thumb}
                    />
                  ) : item.channelImage ? (
                    <img
                      src={HashToURL(item.channelImage, 'CDN', {
                        size: 'small',
                      })}
                      alt=""
                      className={styles.thumb}
                    />
                  ) : (
                    <div className={styles.thumbFallback}>#</div>
                  )}
                  <div className={styles.rowBody}>
                    <span className={styles.rowTitle}>{item.title}</span>
                    <span className={styles.rowSub}>{item.subtitle}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {messageNotifications && pollIds.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Poll comments</h3>
            <div className={styles.list}>
              {pollIds.map((pollId) => {
                const question = polls?.[pollId]?.question
                return (
                  <Link
                    key={`poll:${pollId}`}
                    to={`/poll/${pollId}`}
                    className={styles.row}
                  >
                    <span className={styles.unreadDot} />
                    <div className={styles.thumbFallback}>#{pollId}</div>
                    <div className={styles.rowBody}>
                      <span className={styles.rowTitle}>
                        {question ? bytesToString(question) : `Poll #${pollId}`}
                      </span>
                      <span className={styles.rowSub}>
                        New comment on your poll
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {messageNotifications && tokenKeys.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Artwork comments</h3>
            <div className={styles.list}>
              {tokenKeys.map((tokenKey) => {
                const tokenId = tokenKey.slice(tokenKey.indexOf(':') + 1)
                return (
                  <TokenRow
                    key={`token:${tokenKey}`}
                    tokenId={tokenId}
                    token={tokens[tokenId]}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>
    </Page>
  )
}
