import { useCallback, useEffect, useRef, useState } from 'react'
// import { Visualiser } from './visualiser'
import styles from '@style'
import { PlayIcon, PauseIcon } from '@icons'
import Button from '@atoms/button/Button'
import { PATH } from '@constants'
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
  const [play, setPlay] = useState(false)
  const midiRef = useRef()

  const togglePlay = () => {
    setPlay(!play)
  }

  useEffect(() => {
    if (!midiRef.current) return

    if (play) {
      console.log(midiRef.current.querySelector("div[title='pause']"))
      midiRef.current.querySelector("div[title='pause']").click()
    } else {
      midiRef.current.querySelector("div[title='pause']").click()
    }
  }, [play])

  return displayView ? (
    <div className={styles.container}>
      <img src={displayUri} alt={`cover for midi nft`} />

      <div id="midiPlayer">
        <MidiPlayer src={previewUri ? previewUri : artifactUri} />
      </div>
    </div>
  ) : (
    <div className={styles.feed_container}>
      <img alt={`cover for midi nft ${nft.token_id}`} src={displayUri} />
      <Button className={styles.button} onClick={togglePlay}>
        {play ? (
          <PauseIcon fill="var(--gray-10)" width={64} height={64} />
        ) : (
          <PlayIcon fill="var(--gray-10)" width={64} height={64} />
        )}
      </Button>

      <div
        key={`midi_${play}`}
        id="midiPlayer"
        className={styles.midiPlayer}
        ref={midiRef}
      >
        <MidiPlayer src={previewUri ? previewUri : artifactUri} />
        <div title="play">Play</div>
        <div title="pause">Pause</div>
        <div title="stop">Stop</div>
      </div>
    </div>
  )
}

export default MidiComponent
