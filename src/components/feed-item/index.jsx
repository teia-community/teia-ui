import React from 'react'
import { PATH } from '@constants'
import { Button } from '@atoms/button'
import { ItemInfoCompact } from '@components/item-info'
import { RenderMediaType } from '@components/media-types'
import styles from '@style'
import classnames from 'classnames'
import useLocalSettings from '@hooks/use-local-settings'

/**
 * @param {Object} feedOptions - The options for the feed item
 * @param {import("@types").NFT} feedOptions.nft - The nft to render
 * @returns {React.ReactElement} The feed item
 */
export const FeedItem = ({ nft }) => {
  const { zen, viewMode, nsfwFriendly, photosensitiveFriendly } =
    useLocalSettings()

  const containerClasses = classnames({
    [styles.container]: true,
    [styles.blur]: nft.isNSFW && !nsfwFriendly,
    [styles.photo_protect]: nft.isPhotosensitive && !photosensitiveFriendly,
    [styles.masonry]: viewMode === 'masonry',
  })

  return (
    <div className={containerClasses}>
      <Button
        alt={`OBJKT ${nft.token_id}`}
        to={`${PATH.OBJKT}/${nft.token_id}`}
      >
        <div>
          <RenderMediaType nft={nft} displayView />
        </div>
      </Button>
      {!zen && (
        <div className={styles.token_infos_container}>
          <ItemInfoCompact nft={nft} />
        </div>
      )}
    </div>
  )
}
