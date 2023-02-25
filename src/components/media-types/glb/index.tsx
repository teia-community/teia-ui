// TODO (mel): Cleanup the parameters for all media-types.
// TODO (mel): fix glb in all view, use cover in feeds

import styles from '@style'
import { ImageComponent } from '../image'
import '@google/model-viewer'
import type { MediaTypeProps } from '@types'
import type { ModelViewerElement } from '@google/model-viewer'

/** The types coming from model viewer are camel cased, this does not work */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement
    }
  }
}

export const GLBComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: MediaTypeProps) => {
  // const ref = useRef()
  // const [width, setWidth] = useState('100px')
  // const [height, setHeight] = useState('100px')

  let props: Partial<HTMLElementTagNameMap['model-viewer']> & {
    'auto-rotate'?: boolean
    'data-js-focus-visible'?: boolean
    'interaction-prompt'?: string
    'ar-modes'?: string
    src: string | undefined
  } = {
    src: previewUri ? previewUri : artifactUri || undefined,
  }

  if (displayView) {
    props = {
      ...props,
      autoplay: true,
      'auto-rotate': true,
      'data-js-focus-visible': true,
      'interaction-prompt': 'none',
      ar: true,
      'ar-modes': 'webxr scene-viewer quick-look',
      cameraControls: true,
      //  'camera-controls': true,
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
    <model-viewer
      {...props}
      alt="3D Viewer"
      poster={displayUri || null}
      title={`GLB object ${nft.token_id}`}
    >
      <button slot="ar-button" className={styles.arButton}>
        <div>{'AR'}</div>
      </button>
    </model-viewer>
  ) : (
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
      previewUri={previewUri}
      displayUri={displayUri}
      displayView={false}
      nft={nft}
    />
  )
}

export default GLBComponent
