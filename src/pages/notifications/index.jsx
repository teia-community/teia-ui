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

function TokenRow({ tokenId, token, unread }) {
  const cover = token?.display_uri
    ? HashToURL(token.display_uri, 'CDN', { size: 'small' })
    : token?.thumbnail_uri
    ? HashToURL(token.thumbnail_uri, 'CDN', { size: 'small' })
    : null

  return (
    <Link
      to={`/objkt/${tokenId}/comments`}
      className={`${styles.row} ${unread ? '' : styles.read}`}
    >
      {unread && <span className={styles.unreadDot} />}
      {cover ? (
        <img src={cover} alt="" className={styles.thumb} loading="lazy" />
      ) : (
        <div className={styles.thumbFallback}>#{tokenId}</div>
      )}
      <div className={styles.rowBody}>
        <span className={styles.rowTitle}>
          {token?.name || `OBJKT #${tokenId}`}
        </span>
        <span className={styles.rowSub}>Comment on your artwork</span>
      </div>
    </Link>
  )
}

/**
 * Aggregated notifications center. Lists every notification across DMs/channels,
 * poll comments, and token comments.
 * Both read and unread.
 */
export default function NotificationsCenter() {
  const address = useUserStore((st) => st.address)
  const messageNotifications = useLocalSettings((s) => s.messageNotifications)
  const notifAddress = messageNotifications ? address : undefined

  // --- Channels / DMs ---
  const { data: inbox, isLoading: loadingInbox } = useMyInbox(notifAddress)
  const inboxIds = useMemo(() => (inbox ?? []).map((c) => c.id), [inbox])
  const { data: latestIds } = useChannelLatestMessageIds(inboxIds)
  const { unread: unreadChannels, total: unreadChannelCount } =
    useUnreadChannels(notifAddress, latestIds)

  // --- Poll comments ---
  const { data: pollMap } = useMyPollNotifications(notifAddress)
  const { unread: unreadPolls, total: unreadPollCount } = useUnreadItems(
    notifAddress,
    'poll-comments',
    pollMap
  )
  const [pollsStorage] = useStorage(POLLS_CONTRACT)
  const [polls] = usePolls(pollsStorage)

  // --- Token comments ---
  const { data: tokenMap } = useMyTokenNotifications(notifAddress)
  const { unread: unreadTokens, total: unreadTokenCount } = useUnreadItems(
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

  // All channels, most-recent first, with an unread flag.
  const channelItems = useMemo(() => {
    return (inbox ?? [])
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
          latest: latestIds?.[ch.id] ?? 0,
          unread: Boolean(unreadChannels[ch.id]),
          peer: isDm ? peer : null,
          peerLogo: isDm ? users?.[peer]?.logo : undefined,
          channelImage: !isDm ? ch.metadata?.image : null,
          title,
          subtitle: isDm ? 'Direct message' : 'Message in channel',
        }
      })
      .sort((a, b) => b.latest - a.latest)
  }, [inbox, unreadChannels, latestIds, users, address])

  // All polls / tokens with activity, most-recent first (maxId is monotonic).
  const pollEntries = useMemo(() => {
    return Object.entries(pollMap ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([pollId]) => ({ pollId, unread: Boolean(unreadPolls[pollId]) }))
  }, [pollMap, unreadPolls])

  const tokenEntries = useMemo(() => {
    return Object.entries(tokenMap ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([tokenKey]) => ({
        tokenKey,
        tokenId: tokenKey.slice(tokenKey.indexOf(':') + 1),
        unread: Boolean(unreadTokens[tokenKey]),
      }))
  }, [tokenMap, unreadTokens])

  // Resolve every token's info in one batched query (avoids N+1).
  const tokenIds = useMemo(
    () => tokenEntries.map((t) => t.tokenId),
    [tokenEntries]
  )
  const tokens = useObjktsByIds(tokenIds)

  const itemCount =
    channelItems.length + pollEntries.length + tokenEntries.length
  const unreadCount = unreadChannelCount + unreadPollCount + unreadTokenCount

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
        </div>

        <p className={styles.infoNote}>
          Read/unread status is stored on this device only. If you open Teia in
          another browser or on another computer, items may appear unread again
          — your messages and comments themselves are safe and stored on-chain.
        </p>

        {!messageNotifications && (
          <div className={styles.empty}>
            Notifications are turned off in your settings.
          </div>
        )}

        {messageNotifications && loadingInbox && itemCount === 0 && <Loading />}

        {messageNotifications && itemCount === 0 && !loadingInbox && (
          <div className={styles.empty}>You have no notifications yet.</div>
        )}

        <div className={styles.sections}>
          {messageNotifications && channelItems.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Messages
                {unreadChannelCount > 0 && ` · ${unreadChannelCount} new`}
              </h3>
              <div className={styles.list}>
                {channelItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`${styles.row} ${
                      item.unread ? '' : styles.read
                    }`}
                  >
                    {item.unread && <span className={styles.unreadDot} />}
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

          {messageNotifications && pollEntries.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Poll comments
                {unreadPollCount > 0 && ` · ${unreadPollCount} new`}
              </h3>
              <div className={styles.list}>
                {pollEntries.map(({ pollId, unread }) => {
                  const question = polls?.[pollId]?.question
                  return (
                    <Link
                      key={`poll:${pollId}`}
                      to={`/poll/${pollId}`}
                      className={`${styles.row} ${unread ? '' : styles.read}`}
                    >
                      {unread && <span className={styles.unreadDot} />}
                      <div className={styles.thumbFallback}>#{pollId}</div>
                      <div className={styles.rowBody}>
                        <span className={styles.rowTitle}>
                          {question
                            ? bytesToString(question)
                            : `Poll #${pollId}`}
                        </span>
                        <span className={styles.rowSub}>
                          Comment on your poll
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {messageNotifications && tokenEntries.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Artwork comments
                {unreadTokenCount > 0 && ` · ${unreadTokenCount} new`}
              </h3>
              <div className={styles.list}>
                {tokenEntries.map(({ tokenKey, tokenId, unread }) => (
                  <TokenRow
                    key={`token:${tokenKey}`}
                    tokenId={tokenId}
                    token={tokens[tokenId]}
                    unread={unread}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Page>
  )
}
