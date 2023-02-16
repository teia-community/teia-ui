import { useState, useRef, useEffect } from 'react'
import classnames from 'classnames'

import { Button } from '@atoms/button'
import {
  dataRUIToBuffer,
  prepareFilesFromZIP,
  validateFiles,
} from '@utils/html'
import styles from '@style'
import { GenerativeIcon } from '@icons'
// import './styles.css'
import { useUserStore } from '@context/userStore'
import { useModalStore } from '@context/modalStore'

const uid = Math.round(Math.random() * 1e8).toString()

const allowed_features =
  'accelerometer; camera; fullscreen; gyroscope; microphone; midi *; xr-spatial-tracking;'
const sandbox_features =
  'allow-scripts allow-same-origin allow-modals allow-pointer-lock'

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const HTMLComponent = (props) => {
  const { artifactUri, displayUri, previewUri, nft, displayView } = props

  const address = useUserStore((st) => st.address)
  const showModal = useModalStore((st) => st.show)

  let _creator_ = false
  let _viewer_ = false
  let _objectId_ = false

  if (nft.artist_address) {
    _creator_ = nft.artist_address
  }

  if (address) {
    _viewer_ = address
  }

  if (nft.token_id) {
    _objectId_ = String(nft.token_id)
  }

  // preview
  const iframeRef = useRef(null)
  const unpackedFiles = useRef(null)
  const unpacking = useRef(false)
  const [validHTML, setValidHTML] = useState(null)
  const [validationError, setValidationError] = useState(null)

  const unpackZipFiles = async () => {
    unpacking.current = true

    const buffer = dataRUIToBuffer(previewUri)

    try {
      const filesArr = await prepareFilesFromZIP(buffer)
      const files = filesArr.reduce(
        (memo, f) => ({ ...memo, [f.path]: f.blob }),
        {}
      )

      unpackedFiles.current = files

      const result = await validateFiles(unpackedFiles.current)
      if (result.error) {
        console.error(result.error)
        setValidationError(result.error)
      } else {
        setValidationError(null)
      }
      setValidHTML(result.valid)

      unpacking.current = false
    } catch (e) {
      showModal(`Couldn't unpack ZIP file: ${e}`)
      console.error(e)
      return
    }
  }

  if (previewUri && !unpackedFiles.current && !unpacking.current) {
    unpackZipFiles()
  }

  useEffect(() => {
    const handler = async (event) => {
      if (event.data !== uid) {
        return
      }

      iframeRef.current.contentWindow.postMessage(
        {
          target: 'hicetnunc-html-preview',
          data: unpackedFiles.current,
        },
        '*'
      )
    }

    window.addEventListener('message', handler)

    return () => window.removeEventListener('message', handler)
  }, [previewUri])

  const classes = classnames({
    [styles.container]: true,
    [styles.interactive]: displayView,
  })

  if (previewUri) {
    // creator is viewer in preview
    _creator_ = _viewer_

    if (validHTML) {
      return (
        <div className={classes}>
          <iframe
            ref={iframeRef}
            title={`interactive object ${nft.token_id}`}
            src={`https://teia-community.github.io/teia-ui/gh-pages/html-preview/?uid=${uid}&creator=${_creator_}&viewer=${_viewer_}&objkt=${_objectId_}`}
            sandbox={sandbox_features}
            allow={allowed_features}
          />
        </div>
      )
    } else if (validHTML === false) {
      return (
        <div className={styles.error}>Preview Error: {validationError}</div>
      )
    }
  }

  return displayView ? (
    <div>
      <iframe
        className={`${styles.html} zip-embed`}
        title={`interactive object ${nft.token_id}`}
        src={`${artifactUri}/?creator=${_creator_}&viewer=${_viewer_}&objkt=${_objectId_}`}
        sandbox={sandbox_features}
        allow={allowed_features}
      />
    </div>
  ) : (
    <div className={classes}>
      <div className={styles.preview}>
        <img src={displayUri} alt={`interactive object ${nft.token_id}`} />
        <div className={styles.button}>
          <Button alt="View Generative Token">
            <GenerativeIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HTMLComponent
