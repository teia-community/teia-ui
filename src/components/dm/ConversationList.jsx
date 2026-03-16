import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useConversationList } from '@data/messaging/dm'
import { useUserProfiles } from '@data/swr'
import { useShadownetStore } from '@context/shadownetStore'
import { useChatReadStore } from '@context/chatReadStore'
import { useLocalSettings } from '@context/localSettingsStore'
import styles from './index.module.scss'

function ConversationList() {
  const address = useShadownetStore((st) => st.address)
  const getLastRead = useChatReadStore((st) => st.getLastRead)
  const messageNotifications = useLocalSettings((s) => s.messageNotifications)
  const { data: conversations, isLoading } = useConversationList(address)

  const allAddresses = useMemo(() => {
    if (!conversations) return []
    const set = new Set()
    for (const conv of conversations) {
      for (const p of conv.participants) set.add(p)
    }
    return [...set]
  }, [conversations])

  const [profiles] = useUserProfiles(allAddresses)

  const getName = (addr) => profiles?.[addr]?.name || walletPreview(addr)

  if (!address) {
    return (
      <Page title="Messages">
        <div className={styles.container}>
          <h1 className={styles.headline}>Messages</h1>
          <p className={styles.empty}>
            <Link to="/messages">Connect your Shadownet wallet</Link> to view
            messages.
          </p>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Messages">
      <div className={styles.container}>
        <Link
          to="/messages"
          style={{
            fontSize: '13px',
            display: 'inline-block',
            marginBottom: 12,
          }}
        >
          &larr; Back to Messages
        </Link>
        <h1 className={styles.headline}>Messages</h1>

        <div className={styles.inbox_header}>
          <Link to="/messages/dm/create">
            <Button shadow_box>New Conversation</Button>
          </Link>
        </div>

        {isLoading && <Loading />}

        {!isLoading && (!conversations || conversations.length === 0) && (
          <p className={styles.empty}>No conversations yet.</p>
        )}

        {conversations?.map((conv) => {
          const others = conv.participants.filter((p) => p !== address)
          const displayNames = others.map(getName).join(', ')
          const hasUnread =
            messageNotifications &&
            address &&
            conv.latestOtherMessageId > getLastRead(address, `dm:${conv.id}`)

          return (
            <Link
              key={conv.id}
              to={`/messages/dm/${conv.id}`}
              className={styles.thread_item}
            >
              {hasUnread && <div className={styles.unread_dot} />}
              <div className={styles.stacked_avatars}>
                {others.slice(0, 3).map((addr) => (
                  <Identicon
                    key={addr}
                    address={addr}
                    logo={profiles?.[addr]?.identicon}
                  />
                ))}
              </div>
              <div className={styles.thread_item_content}>
                <div className={styles.thread_item_header}>
                  <span className={styles.thread_item_sender}>
                    {displayNames || 'No participants'}
                  </span>
                  <span className={styles.thread_item_time}>
                    {conv.lastMessage
                      ? getTimeAgo(conv.lastMessage.timestamp)
                      : getTimeAgo(conv.timestamp)}
                  </span>
                </div>
                {conv.lastMessage && (
                  <div className={styles.thread_item_preview}>
                    {conv.lastMessage.preview}
                  </div>
                )}
                <div className={styles.thread_item_meta}>
                  {conv.messageCount > 0 && (
                    <span className={styles.thread_item_badge}>
                      {conv.messageCount}{' '}
                      {conv.messageCount === 1 ? 'message' : 'messages'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Page>
  )
}

export default ConversationList
