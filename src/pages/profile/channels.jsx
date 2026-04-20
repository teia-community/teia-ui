import { Link, useOutletContext } from 'react-router-dom'
import { Loading } from '@atoms/loading'
import { Button } from '@atoms/button'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useChannelList } from '@data/messaging/channels'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import AccessBadge from '@components/channels/AccessBadge'
import styles from './channels.module.scss'

export default function ProfileChannels() {
  const { address } = useOutletContext()
  const { data: channels, isLoading } = useChannelList(address)

  const userChannels = channels?.filter((ch) => ch.creator === address)

  if (isLoading) return <Loading />

  if (!userChannels || userChannels.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No channels created yet.</p>
        <Link to="/messages/channels/create">
          <Button shadow_box>Create a Channel</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {userChannels.map((ch) => (
        <Link
          key={ch.id}
          to={`/messages/channels/${ch.id}`}
          className={styles.channelCard}
        >
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
          <div className={styles.cardContent}>
            <span className={styles.channelName}>
              {ch.metadata?.name || `Channel #${ch.id}`}
            </span>
            <div className={styles.cardMeta}>
              <AccessBadge mode={ch.accessMode} />
              <span className={styles.cardTime}>
                {getTimeAgo(ch.createdAt)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
