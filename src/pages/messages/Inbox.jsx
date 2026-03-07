import { useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { ThreadListItem } from '@components/messaging/ThreadListItem'
import {
  useUserThreads,
  useThreadDetails,
  useUnreadCount,
} from '@data/messaging'
import { useUserProfiles } from '@data/swr'
import styles from '@style'

const PAGE_SIZE = 20

export default function Inbox() {
  const { storage, address } = useOutletContext()
  const [offset, setOffset] = useState(0)
  const [threadIds, participantData] = useUserThreads(
    address,
    storage,
    0,
    offset + PAGE_SIZE
  )
  const [details] = useThreadDetails(threadIds, storage)
  const [unreadCount] = useUnreadCount(address, storage)

  // Collect unique addresses (senders + participants) for alias resolution
  const allAddrs = details
    ? [
        ...new Set(
          Object.values(details)
            .flatMap((d) => [d.rootMessage?.sender, ...(d.participants || [])])
            .filter(Boolean)
        ),
      ]
    : undefined
  const [profiles] = useUserProfiles(
    allAddrs?.length > 0 ? allAddrs : undefined
  )

  if (!address) {
    return (
      <div className={styles.empty}>
        <p>
          <Link to="/sync">Sync your wallet</Link> to view messages.
        </p>
      </div>
    )
  }

  if (!storage) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    )
  }

  if (threadIds.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No messages yet.</p>
      </div>
    )
  }

  return (
    <div>
      {unreadCount > 0 && (
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
        </p>
      )}

      {threadIds.map((id) => {
        const detail = details?.[id]
        return (
          <ThreadListItem
            key={id}
            threadId={id}
            rootMessage={detail?.rootMessage}
            info={detail?.info}
            participants={detail?.participants}
            userAddress={address}
            profiles={profiles}
            isUnread={false}
          />
        )
      })}

      {threadIds.length >= offset + PAGE_SIZE && (
        <div className={styles.load_more}>
          <Button small onClick={() => setOffset(offset + PAGE_SIZE)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
