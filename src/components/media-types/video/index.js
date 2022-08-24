import React, { useEffect, useRef } from 'react'
import { iOS } from '../../../utils/os'
import styles from './styles.module.scss'
import './style.css'

export const VideoComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  preview,
  interactive,
  inView,
  displayView,
  objktID,
}) => {
  const domElement = useRef()

  useEffect(() => {
    const isVideoAvailable = (video) => iOS || video.readyState > 2

    const isVideoPlaying = (video) =>
      video.currentTime > 0 &&
      !video.paused &&
      !video.ended &&
      video.readyState > 2

    if (inView) {
      // play
      if (isVideoAvailable(domElement.current)) {
        try {
          domElement.current.play()
        } catch (err) {
          console.error(err)
        }
      }
    } else {
      // pause
      if (
        isVideoAvailable(domElement.current) &&
        isVideoPlaying(domElement.current)
      ) {
        try {
          domElement.current.pause()
        } catch (err) {
          console.error(err)
        }
      }
    }
  }, [inView])

  return displayView ? (
    <div className={styles.video}>
      <video
        ref={domElement}
        className={styles.displayviewVideo}
        autoPlay={inView}
        playsInline
        muted
        loop
        controls={interactive}
        src={preview ? previewUri : artifactUri}
        poster={displayUri}
        title={`video object ${objktID}`}
      />
    </div>
  ) : (
    <video
      ref={domElement}
      className={styles.video}
      autoPlay={inView}
      playsInline
      muted
      loop
      controls={interactive}
      src={preview ? previewUri : artifactUri}
      poster={displayUri}
      title={`video object ${objktID}`}
    />
  )
}
