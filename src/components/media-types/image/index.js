import React from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import styles from './styles.module.scss'

export const ImageComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  onDetailView,
  preview,
  displayView,
  blur
}) => {
  let src = onDetailView ? artifactUri : displayUri || artifactUri
  if (preview) {
    src = previewUri
  }

  if (displayView) {
    return (
      <div className={styles.container}>
        <LazyLoadImage className={`${styles.image} ${blur ? styles.blur : ''}`} src={src} /* alt="💥" */ />
      </div>
    )
  } else {
    return (
      <div>
        <div>
          <LazyLoadImage className={`${styles.style} ${blur ? styles.blur : ''}`} src={src} /* alt="💥" */ />
        </div>
      </div>
    )
  }
}
