import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
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
import styles from '@style'

export default function ThreadView() {
  const { threadId } = useParams()
  const { storage, address } = useOutletContext()
  const fee = useMessageFee(storage)

  const [messages, mutateMessages] = useThreadMessages(threadId, storage)
  const [threadInfo] = useThreadInfo(threadId, storage)
  const [participants, mutateParticipants] = useThreadParticipants(
    threadId,
    storage
  )

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

  // Message IDs from others for read tracking
  const otherMessageIds = messages
    ?.filter((m) => m.sender !== address)
    .map((m) => m.id)
  const [readSet] = useReadStatus(address, otherMessageIds, storage)

  const reply = useMessagingStore((st) => st.reply)
  const markAsRead = useMessagingStore((st) => st.markAsRead)
  const deleteMessage = useMessagingStore((st) => st.deleteMessage)

  // Auto mark-as-read for other's messages
  useEffect(() => {
    if (!otherMessageIds?.length || !readSet) return
    const unread = otherMessageIds.filter((id) => !readSet.has(id))
    if (unread.length > 0) {
      markAsRead(unread)
    }
  }, [otherMessageIds?.join(','), readSet?.size]) // eslint-disable-line react-hooks/exhaustive-deps

  const allParticipants = [
    ...new Set([...(participants || []), ...addedRecipients]),
  ]

  const handleReply = async (content) => {
    const newRecipients = addedRecipients.length > 0 ? addedRecipients : []
    await reply(threadId, content, newRecipients, fee)
    mutateMessages()
  }

  const handleDelete = async (messageId) => {
    await deleteMessage(messageId)
    mutateMessages()
  }

  const handleAddRecipient = (addr) => {
    setAddedRecipients([...addedRecipients, addr])
  }

  if (!storage || !address) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
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
