import { useEffect, useRef, useState } from 'react'
// import { Visualiser } from './visualiser'
import styles from '@style'
import { PlayIcon, PauseIcon } from '@icons'
import Button from '@atoms/button/Button'
import { PATH } from '@constants'
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
    if (!audioElement.current) return
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

      <audio
        playsInline
        autoPlay={displayView}
        src={previewUri ? previewUri : artifactUri}
        controls
      />
    </div>
  ) : (
    <div className={styles.feed_container}>
      <Button to={`${PATH.OBJKT}/${nft.token_id}`}>
        <img alt={`cover for audio object ${nft.token_id}`} src={displayUri} />
      </Button>
      <Button className={styles.button} onClick={togglePlay}>
        {play ? (
          <PauseIcon fill="var(--gray-10)" width={64} height={64} />
        ) : (
          <PlayIcon fill="var(--gray-10)" width={64} height={64} />
        )}
      </Button>

      <audio ref={audioElement} src={previewUri ? previewUri : artifactUri} />
    </div>
  )
}

export default AudioComponent
