import { useState } from 'react'
import { useParams, useOutletContext, Link } from 'react-router-dom'
import { ChatHeader } from '@components/messaging/ChatHeader'
import { ChatInfoDialog } from '@components/messaging/ChatInfoDialog'
import { AddRecipientDialog } from '@components/messaging/AddRecipientDialog'
import { MessageBubble } from '@components/messaging/MessageBubble'
import { ReplyForm } from '@components/messaging/ReplyForm'
import {
  useThreadMessages,
  useThreadInfo,
  useThreadParticipants,
  useReadStatus,
  useMessageFee,
} from '@data/messaging'
import { useUserProfiles } from '@data/swr'
import { useMessagingStore } from '@context/messagingStore'
import { Button } from '@atoms/button'
import styles from '@style'

export default function ThreadView() {
  const { threadId } = useParams()
  const { storage, address } = useOutletContext()
  const fee = useMessageFee(storage)

  const [messages, mutateMessages] = useThreadMessages(threadId, storage)
  const [threadInfo] = useThreadInfo(threadId, storage)
  const [participants] = useThreadParticipants(threadId, storage)

  const [showInfo, setShowInfo] = useState(false)
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [addedRecipients, setAddedRecipients] = useState([])

  // Collect unique sender addresses for alias resolution
  const senderAddrs = messages
    ? [...new Set(messages.map((m) => m.sender))]
    : undefined
  const [profiles] = useUserProfiles(
    senderAddrs?.length > 0 ? senderAddrs : undefined
  )

  // Read status tracking
  const otherMessageIds = messages
    ?.filter((m) => m.sender !== address)
    .map((m) => m.id)
  const [readSet, mutateReadSet] = useReadStatus(
    address,
    otherMessageIds?.length > 0 ? otherMessageIds : undefined,
    storage
  )
  const unreadIds =
    otherMessageIds?.filter((id) => readSet && !readSet.has(id)) || []

  const reply = useMessagingStore((st) => st.reply)
  const markAsRead = useMessagingStore((st) => st.markAsRead)
  const deleteMessage = useMessagingStore((st) => st.deleteMessage)

  const handleMarkAsRead = async () => {
    if (unreadIds.length === 0) return
    await markAsRead(unreadIds)
    mutateReadSet()
  }

  const allParticipants = [
    ...new Set([...(participants || []), ...addedRecipients]),
  ]

  const handleReply = async (content) => {
    const others = allParticipants.filter((p) => p !== address)
    const replyRecipients = [...new Set([...others, ...addedRecipients])]
    await reply(threadId, content, replyRecipients, fee)
    mutateMessages()
  }

  const handleDelete = async (messageId) => {
    await deleteMessage(messageId)
    mutateMessages()
  }

  const handleAddRecipient = (addr) => {
    setAddedRecipients([...addedRecipients, addr])
  }

  if (!address) {
    return (
      <div className={styles.empty}>
        <p>
          <Link to="/sync">Sync your wallet</Link> to view messages.
        </p>
      </div>
    )
  }

  if (!storage || !participants) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    )
  }

  if (participants.length > 0 && !participants.includes(address)) {
    return (
      <div className={styles.empty}>
        <p>Shhhh postal privacy.</p>
        <p>
          <Link to="/messages">Back to inbox</Link>
        </p>
      </div>
    )
  }

  return (
    <div className={styles.thread_container}>
      <ChatHeader
        participants={allParticipants}
        userAddress={address}
        onInfoClick={() => setShowInfo(true)}
        onAddClick={() => setShowAddRecipient(true)}
      />

      <div className={styles.thread_messages}>
        {messages?.toReversed().map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender === address}
            senderAlias={profiles?.[msg.sender]?.name}
            senderLogo={profiles?.[msg.sender]?.identicon}
            onDelete={msg.sender === address ? handleDelete : undefined}
          />
        ))}
      </div>

      {unreadIds.length > 0 && (
        <div className={styles.mark_read_bar}>
          <Button small onClick={handleMarkAsRead}>
            Mark {unreadIds.length} message{unreadIds.length !== 1 ? 's' : ''}{' '}
            as read
          </Button>
        </div>
      )}

      <ReplyForm onSubmit={handleReply} disabled={!address} />

      {showInfo && (
        <ChatInfoDialog
          participants={allParticipants}
          userAddress={address}
          threadInfo={threadInfo}
          onClose={() => setShowInfo(false)}
        />
      )}

      {showAddRecipient && (
        <AddRecipientDialog
          existingParticipants={allParticipants}
          onAdd={handleAddRecipient}
          onClose={() => setShowAddRecipient(false)}
        />
      )}
    </div>
  )
}
