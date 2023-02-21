import { useEffect, useRef } from 'react'
import { iOS } from '@utils/os'
import styles from '@style'
import ImageComponent from '../image/index'
import { VideoIcon } from '@icons/refs'

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const VideoComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  inView,
  displayView,
  nft,
  forceVideo: force,
}) => {
  const domElement = useRef()

  useEffect(() => {
    if (!displayView) {
      return
    }
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
  }, [inView, displayView])

  if (displayView || force)
    return (
      <video
        ref={domElement}
        className={styles.displayviewVideo}
        autoPlay
        playsInline
        muted={!displayView}
        loop
        controls={displayView}
        src={previewUri ? previewUri : artifactUri}
        poster={displayUri}
        title={`video object ${nft.token_id}`}
      />
    )

  return (
    <>
      <div className={styles.icon}>
        <VideoIcon size={32} />
      </div>
      <ImageComponent
        artifactUri={artifactUri}
        displayUri={displayUri}
        previewUri={previewUri}
        inView={inView}
        displayView={displayView}
        nft={nft}
      />
    </>
  )
}
// <div className={styles.container}>
//   <video
//     ref={domElement}
//     className={styles.video}
//     autoPlay={inView}
//     playsInline
//     muted
//     loop
//     src={previewUri ? previewUri : displayUri}
//     poster={displayUri}
//     title={`video object ${nft.token_id}`}
//   />
// </div>
export default VideoComponent
