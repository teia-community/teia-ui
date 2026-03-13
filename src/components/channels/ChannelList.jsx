import { useState } from 'react'
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

function ChannelCard({ ch, profiles }) {
  return (
    <Link to={`/testnet/channels/${ch.id}`} className={styles.channelCard}>
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
          <span className={styles.cardTime}>{getTimeAgo(ch.timestamp)}</span>
        </div>
        {ch.metadata?.description && (
          <div className={styles.channelDesc}>{ch.metadata.description}</div>
        )}
        <div className={styles.cardMeta}>
          <AccessBadge mode={ch.accessMode} />
          <span className={styles.msgCount}>{ch.message_count} msgs</span>
          <span style={{ fontSize: '11px', opacity: 0.5 }}>
            {profiles?.[ch.creator]?.name || walletPreview(ch.creator)}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ChannelList() {
  const address = useShadownetStore((st) => st.address)
  const { data: channels, isLoading } = useChannelList()
  const [tab, setTab] = useState('all')
  const [myFilter, setMyFilter] = useState('all')

  const creatorAddrs = channels
    ? [...new Set(channels.map((ch) => ch.creator))]
    : undefined
  const [profiles] = useUserProfiles(
    creatorAddrs?.length > 0 ? creatorAddrs : undefined
  )

  const createdChannels = channels?.filter((ch) => ch.creator === address)
  const memberChannels = channels?.filter(
    (ch) => ch.creator !== address && ch.allowlist?.includes(address)
  )
  const myChannels = channels?.filter(
    (ch) => ch.creator === address || ch.allowlist?.includes(address)
  )
  const unrestrictedChannels = channels?.filter(
    (ch) => ch.accessMode === 'unrestricted'
  )
  const displayChannels =
    tab === 'admin'
      ? channels
      : tab === 'my'
      ? myFilter === 'created'
        ? createdChannels
        : myFilter === 'member'
        ? memberChannels
        : myChannels
      : unrestrictedChannels

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

        <div className={styles.channelTabs}>
          <Button
            shadow_box
            selected={tab === 'all'}
            onClick={() => setTab('all')}
          >
            All Channels
          </Button>
          {address && (
            <Button
              shadow_box
              selected={tab === 'my'}
              onClick={() => setTab('my')}
            >
              My Channels
            </Button>
          )}
          {address && (
            <Button
              shadow_box
              selected={tab === 'admin'}
              onClick={() => setTab('admin')}
            >
              Admin All Channels
            </Button>
          )}
        </div>

        {tab === 'my' && address && (
          <div className={styles.channelTabs}>
            <Button
              shadow_box
              selected={myFilter === 'all'}
              onClick={() => setMyFilter('all')}
            >
              All
            </Button>
            <Button
              shadow_box
              selected={myFilter === 'created'}
              onClick={() => setMyFilter('created')}
            >
              Created
            </Button>
            <Button
              shadow_box
              selected={myFilter === 'member'}
              onClick={() => setMyFilter('member')}
            >
              I am part of
            </Button>
          </div>
        )}

        {isLoading && <Loading message="Loading channels..." />}

        {!isLoading && (!displayChannels || displayChannels.length === 0) && (
          <div className={styles.empty}>
            {tab === 'my'
              ? 'You haven\u2019t created any channels yet.'
              : 'No channels yet.'}
          </div>
        )}

        <div className={styles.list}>
          {displayChannels?.map((ch) => (
            <ChannelCard key={ch.id} ch={ch} profiles={profiles} />
          ))}
        </div>
      </div>
    </Page>
  )
}
