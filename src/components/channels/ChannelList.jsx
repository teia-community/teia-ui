import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useChannelList } from '@data/messaging/channels'
import { msgIpfsToUrl } from '@data/messaging/ipfs'
import AccessBadge from './AccessBadge'
import styles from './index.module.scss'

function ChannelCard({ ch }) {
  return (
    <Link to={`/inbox/channels/${ch.id}`} className={styles.channelCard}>
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
        <div className={styles.cardHeader}>
          <span className={styles.channelName}>
            {ch.metadata?.name || `Channel #${ch.id}`}
          </span>
          <span className={styles.cardTime}>{getTimeAgo(ch.createdAt)}</span>
        </div>
        {ch.metadata?.description && (
          <div className={styles.channelDesc}>{ch.metadata.description}</div>
        )}
        <div className={styles.cardMeta}>
          <span style={{ fontSize: '11px', opacity: 0.5 }}>
            {walletPreview(ch.creator)}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ChannelList() {
  const { data: channels, isLoading } = useChannelList()

  const openChannels = channels?.filter(
    (ch) => ch.accessMode === 'unrestricted'
  )

  return (
    <Page title="Public Channels">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.headline}>Public Channels</h2>
          <Link to="/inbox/channels/create">
            <Button shadow_box>Create Public Channel</Button>
          </Link>
        </div>

        {isLoading && <Loading />}

        <div className={styles.list}>
          {openChannels?.map((ch) => (
            <ChannelCard key={ch.id} ch={ch} />
          ))}
          {!isLoading && openChannels?.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
              No channels found
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
