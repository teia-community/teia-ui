import React, { useState } from 'react'
import get from 'lodash/get'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import styles from '@style'

/**
 * @param {Object} imageComponentOptions
 * @param {import("@types").NFT} imageComponentOptions.nft
 **/
export const ImageComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  onDetailView,
  preview,
  displayView,
  nft,
}) => {
  const [isSmol, setSmol] = useState(false)

  let src

  if (preview) {
    src = previewUri
  } else if (onDetailView) {
    src = artifactUri
  } else if (process.env.REACT_APP_IMGPROXY && nft?.teia_meta?.preview_uri) {
    src = `${process.env.REACT_APP_IMGPROXY}${nft.teia_meta.preview_uri}`
  } else if (displayUri) {
    src = displayUri
  } else {
    src = artifactUri
  }

  const onError = (error) => {
    console.error(error)
  }

  const onLoad = ({ target: img }) => {
    // Do whatever you want here
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (w + h < 256) {
      setSmol(true)
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

  return displayView ? (
    <div className={styles.container}>
      <LazyLoadImage
        className={styles.image}
        src={src}
        onLoad={onLoad}
        alt={`object ${nft.token_id} image`}
        onError={onError}
      />
    </div>
  ) : (
    <LazyLoadImage
      className={`${styles.style} ${isSmol ? styles.smol : ''}`}
      src={src}
      effect="opacity"
      alt={`object ${nft.token_id} image`}
      onLoad={onLoad}
      onError={onError}
    />
  )
}

export default ImageComponent
