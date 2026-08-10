import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useClickOutside } from '@hooks/use-click-outside'
import { useUsers } from '@data/swr'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import AccessBadge from './AccessBadge'
import styles from './index.module.scss'

export default function ChannelInfoModal({
  channel,
  channelId,
  members = [],
  admins = [],
  users: knownUsers = {},
  canConfigure = false,
  onShowImage,
  onClose,
}) {
  const contentRef = useRef(null)
  const [memberUsers] = useUsers(members)
  const users = useMemo(
    () => ({ ...knownUsers, ...memberUsers }),
    [knownUsers, memberUsers]
  )
  const channelName = channel.metadata?.name || `Channel #${channelId}`
  const isDm = channel.metadata?.kind === 'dm'

  useClickOutside(contentRef, onClose)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const roleOf = (addr) => {
    if (addr === channel.creator) return 'creator'
    if (admins.includes(addr)) return 'admin'
    return 'member'
  }

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={`About ${channelName}`}
      >
        <div className={styles.infoHead}>
          {channel.metadata?.image && (
            <button
              type="button"
              className={styles.infoImageBtn}
              onClick={onShowImage}
              aria-label="View full size image"
            >
              <img
                src={msgIpfsToUrl(channel.metadata.image)}
                alt=""
                className={styles.infoImage}
              />
            </button>
          )}
          <h3 className={styles.infoTitle}>{channelName}</h3>
          <div className={styles.infoBadges}>
            <AccessBadge mode={channel.accessMode} />
            <span className={styles.infoKind}>
              {isDm ? 'direct message' : 'channel'}
            </span>
          </div>
        </div>

        {channel.metadata?.description && (
          <div className={styles.infoDescription}>
            {channel.metadata.description}
          </div>
        )}

        {channel.creator && (
          <div className={styles.infoSection}>
            <div className={styles.infoSectionTitle}>Created by</div>
            <Link to={`/tz/${channel.creator}`} className={styles.infoMember}>
              <span className={styles.infoMemberAvatar}>
                <Identicon
                  address={channel.creator}
                  logo={users[channel.creator]?.logo}
                />
              </span>
              <span className={styles.infoMemberName}>
                {users[channel.creator]?.alias ||
                  walletPreview(channel.creator)}
              </span>
            </Link>
          </div>
        )}

        {members.some((addr) => addr !== channel.creator) && (
          <div className={styles.infoSection}>
            <div className={styles.infoSectionTitle}>
              Members ({members.length})
            </div>
            <div className={styles.infoMemberList}>
              {members.map((addr) => (
                <Link
                  key={addr}
                  to={`/tz/${addr}`}
                  className={styles.infoMember}
                >
                  <span className={styles.infoMemberAvatar}>
                    <Identicon address={addr} logo={users[addr]?.logo} />
                  </span>
                  <span className={styles.infoMemberName}>
                    {users[addr]?.alias || walletPreview(addr)}
                  </span>
                  <span className={styles.infoMemberRole}>{roleOf(addr)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={styles.infoMeta}>
          #{channelId}
          {channel.createdAt && ` · created ${getTimeAgo(channel.createdAt)}`}
          {` · ${channel.messageCount} message${
            channel.messageCount === 1 ? '' : 's'
          }`}
        </div>

        <div className={styles.infoActions}>
          {canConfigure && (
            <Button shadow_box to={`/inbox/channels/${channelId}/settings`}>
              Settings
            </Button>
          )}
          <Button shadow_box onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
