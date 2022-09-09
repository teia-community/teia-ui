import React, { useState } from 'react'
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
  let src = onDetailView ? artifactUri : displayUri || artifactUri

  const [isVideo, setIsVideo] = useState(false)

  if (preview) {
    src = previewUri
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
        alt={`object ${nft.id} image`}
        onError={onError}
      />
    </div>
  ) : (
    <div>
      <div>
        <LazyLoadImage
          className={styles.style}
          src={src}
          alt={`object ${nft.id} image`}
          onError={onError}
        />
      </div>
    </div>
  )
}
