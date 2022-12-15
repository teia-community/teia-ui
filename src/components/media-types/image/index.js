import React, { useState } from 'react'
import get from 'lodash/get'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import styles from './styles.module.scss'
import { VideoComponent } from '../video'
import { MIMETYPE } from '@constants'

export const ImageComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  onDetailView,
  preview,
  displayView,
  nft,
}) => {
  const [isVideo, setIsVideo] = useState(false)

  let src

  if (preview) {
    src = previewUri
  } else if (onDetailView) {
    src = artifactUri
  } else if (
    process.env.REACT_APP_IMGPROXY &&
    get(nft, 'teia_meta.preview_uri')
  ) {
    src = `${process.env.REACT_APP_IMGPROXY}${get(
      nft,
      'teia_meta.preview_uri'
    )}`
  } else if (displayUri) {
    src = displayUri
  } else {
    src = artifactUri
  }

  const onError = (error) => {
    if (nft.mime === MIMETYPE.GIF) {
      setIsVideo(true)
    }
  }
  // useEffect(() => {
  //   axios
  //     .head(src)
  //     .then((x) => {
  //       const type = x.headers['content-type']
  //       console.debug(`Detected type: ${type}`)
  //       setIsVideo(type.split('/')[0].trim() === 'video')
  //     })
  //     .catch((e) => {
  //       // happens too often
  //       //console.error(e)
  //     })
  //     .finally(() => {
  //       setReady(true)
  //     })
  // }, [src])

  return isVideo ? (
    <VideoComponent
      artifactUri={artifactUri}
      displayUri={displayUri}
      previewUri={previewUri}
      preview={preview}
      onDetailView={onDetailView}
      displayView={displayView}
      inView={true}
      nft={nft}
    />
  ) : displayView ? (
    <div className={styles.container}>
      <LazyLoadImage
        className={styles.image}
        src={src}
        alt={`object ${nft.token_id} image`}
        onError={onError}
      />
    </div>
  ) : (
    <div>
      <div>
        <LazyLoadImage
          className={styles.style}
          src={src}
          alt={`object ${nft.token_id} image`}
          onError={onError}
        />
      </div>
    </div>
  )
}
