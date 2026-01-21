import { useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import styles from '@style'
import { MediaTypeProps } from '@types'
import { useLocalSettings } from '@context/localSettingsStore'

export const ImageComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: MediaTypeProps) => {
  const [isSmol, setSmol] = useState(false)
  const imgproxy = useLocalSettings((st) => st.imgproxy)

  let src

  if (previewUri) {
    src = previewUri
  } else if (displayView) {
    src = artifactUri
  } else if (imgproxy && import.meta.env.VITE_IMGPROXY && nft?.teia_meta?.preview_uri) {
    src = `${import.meta.env.VITE_IMGPROXY}${nft.teia_meta.preview_uri}`
  } else {
    src = displayUri
  }

  const onError = (error: any) => {
    console.error(error)
  }

  const onLoad = (event: any) => {
    const img = event.target as HTMLImageElement
    const w = img.naturalWidth
    const h = img.naturalHeight
    // check for smol mode
    if (w + h < 256) {
      setSmol(true)
    }
  }


  return displayView ? (
    <>
      <LazyLoadImage
        className={`${styles.style} ${isSmol ? styles.smol : ''}`}
        src={src}
        width={600}
        alt={`object ${nft.token_id} image`}
        onLoad={onLoad}
        onError={onError}
      />
    </>
  ) : (
    <div className={styles.container}>
      <LazyLoadImage
        className={`${styles.image} ${isSmol ? styles.smol : ''}`}
        src={src}
        width={600}
        onLoad={onLoad}
        alt={`object ${nft.token_id} image`}
        onError={onError}
      />
    </div>
  )
}

export default ImageComponent
