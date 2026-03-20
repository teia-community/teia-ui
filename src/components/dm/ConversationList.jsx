import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useRoomList } from '@data/messaging/dm'
import { useUserProfiles } from '@data/swr'
import { useShadownetStore } from '@context/shadownetStore'
import { useChatReadStore } from '@context/chatReadStore'
import { useLocalSettings } from '@context/localSettingsStore'
import DmRecipientInput from './DmRecipientInput'
import styles from './index.module.scss'

function ConversationList() {
  const address = useShadownetStore((st) => st.address)
  const getLastRead = useChatReadStore((st) => st.getLastRead)
  const messageNotifications = useLocalSettings((s) => s.messageNotifications)
  const { data: rooms, isLoading } = useRoomList(address)
  const navigate = useNavigate()

  const [searchValue, setSearchValue] = useState('')

  const peerAddresses = rooms ? rooms.map((r) => r.peer) : []
  const [profiles] = useUserProfiles(
    peerAddresses.length > 0 ? peerAddresses : undefined
  )

  const getName = (addr) => profiles?.[addr]?.name || walletPreview(addr)

  const handleRecipientSelect = useCallback(
    (addr) => {
      if (addr) navigate(`/messages/dm/${addr}`)
    },
    [navigate]
  )

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
          <DmRecipientInput
            value={searchValue}
            onChange={(val) => {
              setSearchValue(val)
              if (val && val.trim().length >= 36) {
                handleRecipientSelect(val)
                setSearchValue('')
              }
            }}
            showRemove={false}
          />
        </div>

        {isLoading && <Loading />}

        {!isLoading && (!rooms || rooms.length === 0) && (
          <p className={styles.empty}>No conversations yet.</p>
        )}

        {rooms?.map((room) => {
          const hasUnread =
            messageNotifications &&
            address &&
            room.latestOtherMessageId >
              getLastRead(address, `dm:${room.roomKeyStr}`)

          return (
            <Link
              key={room.roomKeyStr}
              to={`/messages/dm/${room.peer}`}
              className={styles.thread_item}
            >
              {hasUnread && <div className={styles.unread_dot} />}
              <div className={styles.stacked_avatars}>
                <Identicon
                  address={room.peer}
                  logo={profiles?.[room.peer]?.identicon}
                />
              </div>
              <div className={styles.thread_item_content}>
                <div className={styles.thread_item_header}>
                  <span className={styles.thread_item_sender}>
                    {getName(room.peer)}
                  </span>
                  <span className={styles.thread_item_time}>
                    {room.lastMessage
                      ? getTimeAgo(room.lastMessage.timestamp)
                      : getTimeAgo(room.timestamp)}
                  </span>
                </div>
                {room.lastMessage && (
                  <div className={styles.thread_item_preview}>
                    {room.lastMessage.preview}
                  </div>
                )}
                <div className={styles.thread_item_meta}>
                  {room.messageCount > 0 && (
                    <span className={styles.thread_item_badge}>
                      {room.messageCount}{' '}
                      {room.messageCount === 1 ? 'message' : 'messages'}
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
