import { PATH } from '@constants'
import { HashToURL } from '@utils'
import { walletPreview } from '@utils/string'
import { getTimeAgo } from '@utils/time'
import { useLocalSettings } from '@context/localSettingsStore'
import useSettings from '@hooks/use-settings'
import { TezosIcon } from '@icons'
import styles from '@style'
import classnames from 'classnames'
import { Link } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import { sum } from 'lodash'
import { useMemo } from 'react'
import { NFT } from '@types'

/**
 * Short format label, using the same vocabulary as the feeds menu.
 */
function formatLabel(mime?: string): string {
  if (!mime) return '—'
  if (mime === 'image/gif') return 'GIF'
  if (mime === 'application/pdf') return 'PDF'
  if (mime === 'text/markdown') return 'Markdown'
  if (mime.startsWith('image/svg')) return 'Code Art'
  if (mime.startsWith('image/')) return 'Image'
  if (mime.startsWith('video/')) return 'Video'
  if (mime.startsWith('audio/')) return 'Audio'
  if (mime.startsWith('model/')) return '3D'
  if (mime.startsWith('text/html') || mime.includes('zip')) return 'Code Art'
  if (mime.startsWith('text/')) return 'Text'
  return mime
}

/**
 * A single dense row of the list view. Unlike the feed item, it renders a
 * thumbnail rather than the live media, so a screenful of rows does not spin up
 * a screenful of players.
 */
export const FeedListItem = ({ nft }: { nft: NFT }) => {
  const [nsfwFriendly, photosensitiveFriendly] = useLocalSettings(
    (state) => [state.nsfwFriendly, state.photosensitiveFriendly],
    shallow
  )
  const { walletBlockMap, isLoading } = useSettings()

  // Same count the compact info shows: editions still for sale by wallets that
  // are not blocked, out of the total minted.
  const editionsForSale = useMemo(() => {
    if (isLoading) return undefined
    return sum(
      nft.listings
        ?.filter((listing) => walletBlockMap.get(listing.seller_address) !== 1)
        .map(({ amount_left }) => amount_left)
    )
  }, [isLoading, nft.listings, walletBlockMap])

  const thumb = HashToURL(nft.display_uri || nft.thumbnail_uri, 'CDN', {
    size: 'small',
  })
  const artist = nft.artist_profile?.name
  const price =
    typeof nft.price === 'number' ? (Number(nft.price) / 1e6).toString() : null

  const thumbClasses = classnames({
    [styles.list_thumb]: true,
    [styles.blur]: nft.isNSFW && !nsfwFriendly,
    [styles.photo_protect]: nft.isPhotosensitive && !photosensitiveFriendly,
  })

  return (
    <div
      className={styles.list_row}
      aria-label={`OBJKT ${nft.token_id}: ${nft.name}`}
    >
      <Link
        aria-label={`View OBJKT ${nft.token_id}: ${nft.name}`}
        to={`${PATH.OBJKT}/${nft.token_id}`}
        className={styles.list_main}
      >
        <span className={thumbClasses}>
          {thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
        </span>
        <span className={styles.list_title}>
          <span className={styles.list_name}>
            {nft.name || `Untitled #${nft.token_id}`}
          </span>
          <span className={styles.list_token_id}>#{nft.token_id}</span>
        </span>
      </Link>

      <Link
        aria-label={`Go to artist page of ${artist || nft.artist_address}`}
        to={artist ? `/${encodeURIComponent(artist)}` : `/tz/${nft.artist_address}`}
        className={styles.list_artist}
      >
        {artist || walletPreview(nft.artist_address)}
      </Link>

      <span className={styles.list_format}>{formatLabel(nft.mime_type)}</span>

      <span
        className={styles.list_editions}
        aria-label={`Editions: ${editionsForSale || 'X'} of ${
          nft.editions
        } available`}
      >
        {editionsForSale || 'X'}/{nft.editions}
      </span>

      <span
        className={styles.list_price}
        aria-label={price ? `Price: ${price} Tezos` : 'Not for sale'}
      >
        {price ? (
          <>
            {price}
            <TezosIcon size={14} />
          </>
        ) : (
          'X'
        )}
      </span>

      <span className={styles.list_date} title={nft.minted_at}>
        {getTimeAgo(nft.minted_at)}
      </span>
    </div>
  )
}

export default FeedListItem
