import React, { useContext } from 'react'
import { PATH } from '../../constants'
import { Button } from '@atoms/button'
import { ItemInfoCompact } from '@components/item-info'
import { renderMediaType } from '@components/media-types'
import styles from '@style'
import classnames from 'classnames'
import { HicetnuncContext } from '@context/HicetnuncContext'

/**
 * @param {Object} feedOptions - The options for the feed item
 * @param {import("@types").NFT} feedOptions.nft - The nft to render
 * @returns {React.ReactElement} The feed item
 */
export const FeedItem = ({ nft, zen }) => {
  const { viewMode } = useContext(HicetnuncContext)

  const containerClasses = classnames({
    [styles.container]: true,
    [styles.blur]: nft.isNSFW,
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
