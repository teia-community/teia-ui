import React, { useEffect, useRef, useState } from 'react'
// import { Visualiser } from './visualiser'
import styles from '@style'
import { PlayIcon, PauseIcon } from '@icons'
import Button from '@atoms/button/Button'
/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const AudioComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}) => {
  // const visualiser = useRef()
  // const [userTouched, setUserTouched] = useState(false)
  const audioElement = useRef()
  const [play, setPlay] = useState(false)
  const togglePlay = () => {
    setPlay(!play)
  }

  useEffect(() => {
    if (play) audioElement.current.play()
    else audioElement.current.pause()
  }, [play])

  // user interaction
  // useEffect(() => {
  //   if (userTouched) {
  //     visualiser.current.init()
  //   }
  // }, [userTouched])

  // useEffect(() => {
  //   if (userTouched) {
  //     if (play) {
  //       visualiser.current.play()
  //     } else {
  //       visualiser.current.pause()
  //     }
  //   }
  // }, [play, userTouched])

  return displayView ? (
    <div className={styles.container}>
      <img src={displayUri} alt={`cover for audio object ${nft.token_id}`} />

      <audio src={previewUri ? previewUri : artifactUri} controls />
    </div>
  ) : (
    <div className={styles.feed_container}>
      <img alt={`cover for audio object ${nft.token_id}`} src={displayUri} />
      <Button className={styles.button} onClick={togglePlay}>
        {play ? (
          <PauseIcon width={64} height={64} />
        ) : (
          <PlayIcon width={64} height={64} />
        )}
      </Button>

      <audio ref={audioElement} src={previewUri ? previewUri : artifactUri} />
    </div>
  )
}

export default AudioComponent
