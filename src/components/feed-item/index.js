import React, { useContext } from 'react'
import get from 'lodash/get'
import { PATH } from '../../constants'
import { Button } from '@atoms/button'
import { ItemInfoCompact } from '@components/item-info'
import { renderMediaType } from '@components/media-types'
import styles from '@style'
import { METADATA_CONTENT_RATING_MATURE } from '@constants'
import useSettings from 'hooks/use-settings'
import classnames from 'classnames'
import { HicetnuncContext } from '@context/HicetnuncContext'

/**
 * @param {Object} feedOptions - The options for the feed item
 * @param {import("@types").NFT} feedOptions.nft - The nft to render
 * @returns {React.ReactElement} The feed item
 */
export const FeedItem = ({ nft, zen }) => {
  const { nsfwMap } = useSettings()
  const { viewMode } = useContext(HicetnuncContext)

  const isNSFW = (nft) => {
    return (
      nsfwMap.get(nft.token_id) === 1 ||
      (get(nft, 'teia_meta.content_rating') &&
        get(nft, 'teia_meta.content_rating') === METADATA_CONTENT_RATING_MATURE)
    )
  }

  const containerClasses = classnames({
    [styles.container]: true,
    [styles.blur]: isNSFW(nft),
    [styles.masonry]: viewMode === 'masonry',
  })
  return (
    <div className={containerClasses}>
      <Button to={`${PATH.OBJKT}/${nft.token_id}`}>
        <div>
          {renderMediaType({
            nft,
            displayView: true,
          })}
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
