// TODO (mel): Cleanup the parameters for all media-types.
// TODO (mel): fix glb in all view, use cover in feeds

import React /*  useRef, useState */ from 'react'
import styles from '@style'
import { ImageComponent } from '../image'

export const GLBComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  preview,
  onDetailView,
  displayView,
  objktID,
  nft,
}) => {
  // const ref = useRef()
  // const [width, setWidth] = useState('100px')
  // const [height, setHeight] = useState('100px')

  let props = {
    src: preview ? previewUri : artifactUri,
  }

  if (onDetailView) {
    props = {
      ...props,
      autoplay: true,
      'auto-rotate': true,
      'data-js-focus-visible': true,
      'interaction-prompt': 'none',
      ar: true,
      'ar-modes': 'webxr scene-viewer quick-look',
      'camera-controls': true,
    }
  }

  // const handleResize = () => {
  //   if (ref.current) {
  //     const { width, height } = ref.current.getBoundingClientRect()
  //     setWidth(width)
  //     setHeight(height)
  //   }
  // }

  // useEffect(() => {
  //   handleResize()
  //   global.addEventListener('resize', handleResize)

  //   return () => {
  //     global.removeEventListener('resize', handleResize)
  //   }
  // }, [width, height])
  return displayView ? (
    // <div className={styles.container} ref={ref}>
    //   <model-viewer
    //     {...props}
    //     style={{ width, height }}
    //     title={`GLB object ${objktID}`}
    //   >
    //     <button slot="ar-button" className={styles.arButton}>
    //       AR
    //     </button>
    //   </model-viewer>
    // </div>
    <ImageComponent
      // key={`img-${objktID}`}
      artifactUri={artifactUri}
      previewUri={previewUri}
      onDetailView={false}
      displayUri
      displayView={true}
      nft={nft}
    />
  ) : (
    <model-viewer {...props} title={`GLB object ${objktID}`}>
      <button slot="ar-button" className={styles.arButton}>
        AR
      </button>
    </model-viewer>
  )
}

export default GLBComponent
