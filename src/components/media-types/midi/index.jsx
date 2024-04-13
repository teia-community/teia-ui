import { useEffect, useRef, useState } from 'react'
// import { Visualiser } from './visualiser'
import styles from '@style'
import { PlayIcon, PauseIcon } from '@icons'
import Button from '@atoms/button/Button'
import { PATH } from '@constants'
import MidiPlayer from 'react-midi-player'
/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const MidiComponent = ({
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
      <img src={displayUri} alt={`cover for midi object ${nft.token_id}`} />

      <MidiPlayer src={previewUri ? previewUri : artifactUri} />
    </div>
  ) : (
    <div className={styles.feed_container}>
      <img alt={`cover for midi object ${nft.token_id}`} src={displayUri} />
      <Button className={styles.button} onClick={togglePlay}>
        {play ? (
          <PauseIcon fill="var(--gray-10)" width={64} height={64} />
        ) : (
          <PlayIcon fill="var(--gray-10)" width={64} height={64} />
        )}
      </Button>

      <MidiPlayer src={previewUri ? previewUri : artifactUri} />
    </div>
  )
}

export default MidiComponent
