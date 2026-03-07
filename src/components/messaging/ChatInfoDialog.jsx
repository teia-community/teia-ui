/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useEffect, useCallback } from 'react'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { useUserProfiles } from '@data/swr'
import styles from '@style'

export const ChatInfoDialog = ({
  participants,
  userAddress,
  threadInfo,
  onClose,
}) => {
  const [profiles] = useUserProfiles(
    participants?.length > 0 ? participants : undefined
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const replyModeLabel = threadInfo?.reply_mode
    ? Object.keys(threadInfo.reply_mode)[0]
    : 'open'

  return (
    <div
      className={styles.dialog_backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Thread Info"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.dialog}
        role="document"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={styles.dialog_header}>
          <h3>Thread Info</h3>
          <button className={styles.dialog_close} onClick={onClose}>
            &times;
          </button>
        </div>

        <p>
          Reply mode: <strong>{replyModeLabel}</strong>
        </p>
        {threadInfo?.reply_count != null && (
          <p>Replies: {threadInfo.reply_count}</p>
        )}

        <h4>Participants ({participants?.length || 0})</h4>
        {participants?.map((addr) => (
          <div key={addr} className={styles.dialog_participant}>
            <Identicon
              address={addr}
              logo={profiles?.[addr]?.identicon}
              className={styles.dialog_avatar}
            />
            <span>{profiles?.[addr]?.name || walletPreview(addr)}</span>
            {addr === userAddress && (
              <span className={styles.dialog_you_badge}>YOU</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
