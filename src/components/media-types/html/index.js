import React, { useContext, useState, useRef, useEffect } from 'react'
import classnames from 'classnames'
import { HicetnuncContext } from '../../../context/HicetnuncContext'
import { Button } from '../../button'
import {
  dataRUIToBuffer,
  prepareFilesFromZIP,
  validateFiles,
} from '../../../utils/html'
import { VisuallyHidden } from '../../visually-hidden'
import styles from './styles.module.scss'
import GenerativeIcon from '@icons/generative'
// import './styles.css'

const uid = Math.round(Math.random() * 100000000).toString()

export const HTMLComponent = (props) => {
  const {
    artifactUri,
    displayUri,
    previewUri,
    creator,
    objkt,
    onDetailView,
    preview,
    displayView,
  } = props
  const context = useContext(HicetnuncContext)

  let _creator_ = false
  let _viewer_ = false
  let _objectId_ = false

  if (creator && creator.address) {
    _creator_ = creator.address
  }

  if (context.address && context.address.address) {
    _viewer_ = context.address.address
  }

  if (objkt) {
    _objectId_ = String(objkt)
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
      context.showFeedback(`Couldn't unpack ZIP file: ${e}`)
      console.error(e)
      return
    }
  }

  if (preview && !unpackedFiles.current && !unpacking.current) {
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
    [styles.interactive]: onDetailView,
  })

  if (preview) {
    // creator is viewer in preview
    _creator_ = _viewer_

    if (validHTML) {
      return (
        <div className={classes}>
          <iframe
            ref={iframeRef}
            title={`interactive object ${objkt}`}
            src={`https://teia-community.github.io/teia-ui/gh-pages/html-preview/?uid=${uid}&creator=${_creator_}&viewer=${_viewer_}&objkt=${_objectId_}`}
            sandbox="allow-scripts allow-same-origin allow-modals allow-pointer-lock"
            allow="accelerometer; camera; gyroscope; microphone; xr-spatial-tracking;"
          />
        </div>
      )
    } else if (validHTML === false) {
      return (
        <div className={styles.error}>Preview Error: {validationError}</div>
      )
    }
  }

  if (!onDetailView) {
    return (
      <div className={classes}>
        <div className={styles.preview}>
          <img src={displayUri} alt={`interactive object ${objkt}`} />
          <div className={styles.button}>
            <Button>
              <VisuallyHidden>View</VisuallyHidden>
              <GenerativeIcon />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!displayView) {
    try {
      return (
        <div>
          <iframe
            className={styles.html + ' zip-embed'}
            title={`interactive object ${objkt}`}
            src={`${artifactUri}/?creator=${_creator_}&viewer=${_viewer_}&objkt=${_objectId_}`}
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            allow="accelerometer; camera; gyroscope; microphone; xr-spatial-tracking;"
          />
        </div>
      )
    } catch (err) {
      return undefined
    }
  } else {
    return (
      <div>
        <iframe
          className={styles.html}
          title={`interactive object ${objkt}`}
          src={`${artifactUri}/?creator=${_creator_}&viewer=${_viewer_}&objkt=${_objectId_}`}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          allow="accelerometer; camera; gyroscope; microphone; xr-spatial-tracking;"
        />
      </div>
    )
  }
}
