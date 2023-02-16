import { PATH } from '@constants'
import { ItemInfoCompact } from '@components/item-info'
import { RenderMediaType } from '@components/media-types'
import styles from '@style'
import classnames from 'classnames'
import { useLocalSettings } from '@context/localSettingsStore'
import { Link } from 'react-router-dom'
import { shallow } from 'zustand/shallow'

/**
 * @param {Object} feedOptions - The options for the feed item
 * @param {import("@types").NFT} feedOptions.nft - The nft to render
 * @returns {React.ReactElement} The feed item
 */
export const FeedItem = ({ nft }) => {
  const [nsfwFriendly, photosensitiveFriendly] = useLocalSettings(
    (state) => [state.nsfwFriendly, state.photosensitiveFriendly],
    shallow
  )
  const zen = useLocalSettings((st) => st.zen)
  const viewMode = useLocalSettings((st) => st.viewMode)

  const containerClasses = classnames({
    [styles.container]: true,
    [styles.blur]: nft.isNSFW && !nsfwFriendly,
    [styles.photo_protect]: nft.isPhotosensitive && !photosensitiveFriendly,
    [styles.masonry]: viewMode === 'masonry',
  })

  return (
    <div className={containerClasses}>
      {nft.mime_type.startsWith('audio') ? (
        <RenderMediaType nft={nft} />
      ) : (
        <Link
          aria-label={`OBJKT ${nft.token_id}`}
          to={`${PATH.OBJKT}/${nft.token_id}`}
        >
          <RenderMediaType nft={nft} />
        </Link>
      )}
      {!zen && (
        <div className={styles.token_infos_container}>
          <ItemInfoCompact nft={nft} />
        </div>
      )}
    </div>
  )
}
