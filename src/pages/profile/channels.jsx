import { Link, useOutletContext } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { useUserStore } from '@context/userStore'
import { useChannelList, ipfsToUrl } from '@data/messaging/channels'
import { getTimeAgo } from '@utils/time'
import AccessBadge from '@components/channels/AccessBadge'
import styles from './channels.module.scss'

function ChannelCard({ ch }) {
  return (
    <Link to={`/messages/channels/${ch.id}`} className={styles.channelCard}>
      <div className={styles.cardTop}>
        {ch.metadata?.image ? (
          <img
            src={ipfsToUrl(ch.metadata.image)}
            alt=""
            className={styles.channelImage}
          />
        ) : (
          <div className={styles.channelImagePlaceholder}>
            {(ch.metadata?.name || '#')[0].toUpperCase()}
          </div>
        )}
        <div>
          <span className={styles.channelName}>
            {ch.metadata?.name || `Channel #${ch.id}`}
          </span>
          <span className={styles.cardTime}>{getTimeAgo(ch.timestamp)}</span>
        </div>
      </div>
      {ch.metadata?.description && (
        <div className={styles.channelDesc}>{ch.metadata.description}</div>
      )}
      <div className={styles.cardMeta}>
        <AccessBadge mode={ch.accessMode} />
        <span className={styles.msgCount}>{ch.message_count} msgs</span>
      </div>
    </Link>
  )
}

export default function ProfileChannels() {
  const { address } = useOutletContext()
  const connectedAddress = useUserStore((st) => st.address)

  const { data: channels, isLoading } = useChannelList()

  if (isLoading) {
    return <Loading message="Loading channels" />
  }

  const userChannels = channels?.filter((ch) => ch.creator === address) || []
  const isOwnProfile = address === connectedAddress

  if (userChannels.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          No channels created yet.
          {isOwnProfile && (
            <>
              {' '}
              <Link to="/messages/channels/create">
                Create your first channel!
              </Link>
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.channels_list}>
      {userChannels.map((ch) => (
        <ChannelCard key={ch.id} ch={ch} />
      ))}
    </div>
  )
}
