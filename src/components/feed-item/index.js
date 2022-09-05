import React from 'react'
import { PATH } from '../../constants'
import { Padding } from '../layout'
import { Button } from '../button'
import { ItemInfo } from '../item-info'
import { renderMediaType } from '../media-types'
import styles from './styles.module.scss'
import { getNsfwList, METADATA_CONTENT_RATING_MATURE } from '@constants'

export const FeedItem = ({ nft }) => {
  const nsfwList = getNsfwList()
  return (
    <Padding>
      <Button to={`${PATH.OBJKT}/${nft.id}`}>
        <div
          className={`${styles.container} ${
            nsfwList.includes(nft.id) ||
            (nft.content_rating &&
              nft.content_rating === METADATA_CONTENT_RATING_MATURE)
              ? styles.blur
              : ''
          }`}
        >
          {renderMediaType({
            nft,
            displayView: true,
          })}
        </div>
      </Button>
      <div style={{ paddingLeft: '15px', paddingRight: '15px' }}>
        <ItemInfo {...nft} />
      </div>
    </Padding>
  )
}
