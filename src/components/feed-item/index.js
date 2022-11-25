import React from 'react'
import get from 'lodash/get'
import { PATH } from '../../constants'
import { Padding } from '../layout'
import { Button } from '../button'
import { ItemInfoCompact } from '../item-info'
import { renderMediaType } from '../media-types'
import styles from './styles.module.scss'
import { METADATA_CONTENT_RATING_MATURE } from '@constants'
import useSettings from 'hooks/use-settings'

export const FeedItem = ({ nft }) => {
  const { nsfwMap } = useSettings()

  return (
    <Padding>
      <Button to={`${PATH.OBJKT}/${nft.token_id}`}>
        <div
          className={`${styles.container} ${
            nsfwMap.get(nft.token_id) === 1 ||
            (get(nft, 'teia_meta.content_rating') &&
              get(nft, 'teia_meta.content_rating') ===
                METADATA_CONTENT_RATING_MATURE)
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
        <ItemInfoCompact nft={nft} />
      </div>
    </Padding>
  )
}
