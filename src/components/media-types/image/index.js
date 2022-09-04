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
  const onError = async (e, _f) => {
    // I hope there is a better way 🥹
    const http = new XMLHttpRequest()
    http.open('HEAD', e.target.src)
    http.onreadystatechange = function () {
      if (this.readyState === this.DONE) {
        if (this.status === 200) {
          console.debug(`image from ${artifactUri} is actually a video`)
          setIsVideo(true)
        } else {
          console.error(
            `Error loading image from cache: ${this.status} -> ${this.statusText}`
          )
        }
      }
    }
    http.send()
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
