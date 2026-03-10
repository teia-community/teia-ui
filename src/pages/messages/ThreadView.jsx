import { useState, useEffect } from 'react'
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
  useMessageFee,
} from '@data/messaging'
import { useUserProfiles } from '@data/swr'
import { useMessagingStore } from '@context/messagingStore'
import { useLocalSettings } from '@context/localSettingsStore'
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

  // Auto-mark messages as read in local storage
  const markMessagesRead = useLocalSettings((s) => s.markMessagesRead)

  useEffect(() => {
    if (messages?.length) {
      const ids = messages
        .filter((m) => m.sender !== address)
        .map((m) => String(m.id))
      if (ids.length > 0) {
        markMessagesRead(ids)
      }
    }
  }, [messages, address, markMessagesRead])

  const reply = useMessagingStore((st) => st.reply)
  const deleteMessage = useMessagingStore((st) => st.deleteMessage)

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
