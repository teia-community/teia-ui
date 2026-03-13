import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Loading } from '@atoms/loading'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useChannelList, ipfsToUrl } from '@data/channels'
import { useUserProfiles } from '@data/swr'
import { useShadownetStore } from '@context/shadownetStore'
import AccessBadge from './AccessBadge'
import styles from '@style'

export default function ChannelList() {
  const address = useShadownetStore((st) => st.address)
  const { data: channels, isLoading } = useChannelList()

  const creatorAddrs = channels
    ? [...new Set(channels.map((ch) => ch.creator))]
    : undefined
  const [profiles] = useUserProfiles(
    creatorAddrs?.length > 0 ? creatorAddrs : undefined
  )

  return (
    <Page title="Channels">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headline}>Channels</h1>
          {address && (
            <Button shadow_box to="/testnet/channels/create">
              Create Channel
            </Button>
          )}
        </div>

        {isLoading && <Loading message="Loading channels..." />}

        {!isLoading && (!channels || channels.length === 0) && (
          <div className={styles.empty}>
            No channels yet. Be the first to create one.
          </div>
        )}

        <div className={styles.list}>
          {channels?.map((ch) => (
            <Link
              key={ch.id}
              to={`/testnet/channels/${ch.id}`}
              className={styles.channelCard}
            >
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
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <span className={styles.channelName}>
                    {ch.metadata?.name || `Channel #${ch.id}`}
                  </span>
                  <span className={styles.cardTime}>
                    {getTimeAgo(ch.timestamp)}
                  </span>
                </div>
                {ch.metadata?.description && (
                  <div className={styles.channelDesc}>
                    {ch.metadata.description}
                  </div>
                )}
                <div className={styles.cardMeta}>
                  <AccessBadge mode={ch.accessMode} />
                  <span className={styles.msgCount}>
                    {ch.message_count} msgs
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.5 }}>
                    {profiles?.[ch.creator]?.name || walletPreview(ch.creator)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Page>
  )
}
