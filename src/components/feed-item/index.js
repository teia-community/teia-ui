import React from 'react'
import { PATH } from '../../constants'
import { Padding } from '../layout'
import { Button } from '../button'
import { ItemInfo } from '../item-info'
import { renderMediaType } from '../media-types'
import styles from './styles.module.scss'
import { getNsfwList, METADATA_CONTENT_RATING_MATURE } from '@constants'

export const FeedItem = (props) => {
  const nsfwList = getNsfwList()
  return (
    <Padding>
      <Button to={`${PATH.OBJKT}/${props.id}`}>
        <div
          className={`${styles.container} ${
            nsfwList.includes(props.id) ||
            (props.content_rating &&
              props.content_rating === METADATA_CONTENT_RATING_MATURE)
              ? styles.blur
              : ''
          }`}
        >
          {renderMediaType({
            mimeType: props.mime,
            artifactUri: props.artifact_uri,
            displayUri: props.display_uri,
            creator: props.creator_id,
            objktID: String(props.id),
            title: props.title,
            displayView: true,
          })}
        </div>
      </Button>
      <div style={{ paddingLeft: '15px', paddingRight: '15px' }}>
        <ItemInfo {...props} />
      </div>
    </Padding>
  )
}
