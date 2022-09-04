import React, { useEffect, useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import styles from './styles.module.scss'
import { VideoComponent } from '../video'
import axios from 'axios'

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

  const [isVideo, setIsVideo] = useState(false)
  const [ready, setReady] = useState(false)

  if (preview) {
    src = previewUri
  }

  useEffect(() => {
    axios
      .head(src)
      .then((x) => {
        const type = x.headers['content-type']
        console.debug(`Detected type: ${type}`)
        setIsVideo(type.split('/')[0].trim() === 'video')
      })
      .catch((e) => {
        // happens too often
        //console.error(e)
      })
      .finally(() => {
        setReady(true)
      })
  }, [src])

  return ready && isVideo ? (
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
      />
    </div>
  ) : (
    <div>
      <div>
        <LazyLoadImage
          className={styles.style}
          src={src}
          alt={`object ${objktID} image`}
        />
      </div>
    </div>
  )
}
