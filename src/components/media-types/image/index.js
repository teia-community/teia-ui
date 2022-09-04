import React, { useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import styles from './styles.module.scss'
import { VideoComponent } from '../video'

export const ImageComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  onDetailView,
  preview,
  displayView,
  objktID,
}) => {
  let src = onDetailView ? artifactUri : displayUri || artifactUri

  if (preview) {
    src = previewUri
  }

  const [isVideo, setIsVideo] = useState(false)
  const onError = (e) => {
    console.debug(`image from ${artifactUri} is actually a video`)
    setIsVideo(true)
  }
  return isVideo ? (
    <VideoComponent
      artifactUri={artifactUri}
      displayUri={displayUri}
      previewUri={previewUri}
      preview={preview}
      onDetailView={onDetailView}
      displayView={displayView}
      inView={!displayView}
      objktID={objktID}
    />
  ) : displayView ? (
    <div className={styles.container}>
      <LazyLoadImage
        className={styles.image}
        src={src}
        alt={`object ${objktID} image`}
        onError={onError}
      />
    </div>
  ) : (
    <div>
      <div>
        <LazyLoadImage
          className={styles.style}
          src={src}
          alt={`object ${objktID} image`}
          onError={onError}
        />
      </div>
    </div>
  )
}
