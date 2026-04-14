import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { Identicon } from '@atoms/identicons'
import { useUsers } from '@data/swr'
import { useRoomList } from '@data/messaging/dm'
import { useUserStore } from '@context/userStore'
import { useChatReadStore } from '@context/chatReadStore'
import DmRecipientInput from './DmRecipientInput'
import styles from './index.module.scss'

function RoomCard({ room, address, users }) {
  const getLastRead = useChatReadStore((st) => st.getLastRead)
  const lastRead = getLastRead(address, `dm:${room.roomKeyStr}`)
  const hasUnread =
    room.latestMessageId && parseInt(room.latestMessageId) > lastRead
  const peerUser = users[room.peer]

  return (
    <Link to={`/messages/dm/${room.peer}`} className={styles.roomCard}>
      {hasUnread && <div className={styles.unreadDot} />}
      <Identicon
        address={room.peer}
        logo={peerUser?.logo}
        className={styles.roomAvatar}
      />
      <div className={styles.roomContent}>
        <div className={styles.roomHeader}>
          <span className={styles.roomPeer}>
            {peerUser?.alias || walletPreview(room.peer)}
          </span>
          {room.lastMessage && (
            <span className={styles.roomTime}>
              {getTimeAgo(room.lastMessage.timestamp)}
            </span>
          )}
        </div>
        {room.lastMessage && (
          <div className={styles.roomPreview}>
            {room.lastMessage.preview || '...'}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function ConversationList() {
  const address = useUserStore((st) => st.address)
  const { data: rooms, isLoading } = useRoomList(address)
  const [users] = useUsers(rooms?.map((r) => r.peer) ?? [])

  if (!address) {
    return (
      <Page title="Direct Messages">
        <div style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>
          Connect your wallet to see your messages.
        </div>
      </Page>
    )
  }

  return (
    <Page title="Direct Messages">
      <div className={styles.container}>
        <h2 className={styles.headline}>Direct Messages</h2>

        <DmRecipientInput />

        {isLoading && <Loading />}

        <div className={styles.list}>
          {rooms?.map((room) => (
            <RoomCard
              key={room.roomKeyStr}
              room={room}
              address={address}
              users={users}
            />
          ))}
          {!isLoading && rooms?.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
              No conversations yet. Start one above.
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
