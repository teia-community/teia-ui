import { Link, useOutletContext } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { getTimeAgo } from '@utils/time'
import { useChannelList } from '@data/messaging/channels'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import { useUserStore } from '@context/userStore'
import AccessBadge from '@components/channels/AccessBadge'
import styles from './channels.module.scss'

export default function ProfileChannels() {
  const { address } = useOutletContext()
  const viewerAddress = useUserStore((st) => st.address)
  const isOwnProfile = viewerAddress && viewerAddress === address
  const { data: channels, isLoading } = useChannelList()

  const userChannels = channels?.filter((ch) => {
    if (ch.creator !== address) return false
    if (isOwnProfile) return true
    return ch.accessMode === 'unrestricted'
  })

  if (isLoading) return <Loading />

  if (!userChannels || userChannels.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No channels yet.</p>
        {isOwnProfile && (
          <Link to="/inbox/channels/create">
            <Button shadow_box>Create a Channel</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {userChannels.map((ch) => (
        <Link
          key={ch.id}
          to={`/inbox/channels/${ch.id}`}
          className={styles.channelCard}
        >
          <div className={styles.cardTop}>
            {ch.metadata?.image ? (
              <img
                src={msgIpfsToUrl(ch.metadata.image)}
                alt=""
                className={styles.channelImage}
              />
            ) : (
              <div className={styles.channelImagePlaceholder}>
                {(ch.metadata?.name || '#')[0].toUpperCase()}
              </div>
            )}
            <span className={styles.channelName}>
              {ch.metadata?.name || `Channel #${ch.id}`}
            </span>
          </div>
          {ch.metadata?.description && (
            <div className={styles.channelDesc}>{ch.metadata.description}</div>
          )}
          <div className={styles.cardMeta}>
            <AccessBadge mode={ch.accessMode} />
            <span className={styles.cardTime}>{getTimeAgo(ch.createdAt)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
