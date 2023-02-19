import { useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import styles from '@style'
import { MediaTypeProps } from '@types'

export const ImageComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: MediaTypeProps) => {
  const [isSmol, setSmol] = useState(false)

  let src

  if (previewUri) {
    src = previewUri
  } else if (displayView) {
    src = artifactUri
  } else if (import.meta.env.VITE_IMGPROXY && nft?.teia_meta?.preview_uri) {
    src = `${import.meta.env.VITE_IMGPROXY}${nft.teia_meta.preview_uri}`
  } else {
    src = displayUri
  }

  const onError = (error: any) => {
    console.error(error)
  }

  const onLoad = ({ target: img }: { target: HTMLImageElement }) => {
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
