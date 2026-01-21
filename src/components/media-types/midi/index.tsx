import { useCallback, useEffect, useRef, useState } from 'react'
import 'html-midi-player'

import Button from '@atoms/button/Button'
import { PlayIcon, PauseIcon } from '@icons'
import { PATH } from '@constants'
import { blobToDataURL, getMidiUrlData } from '@utils/media'
import styles from '@style'
import processMidiData from '@utils/midi'
import { MIDIPlayer } from '@magenta/music'

/**
 * @param {import("@types").MediaTypeProps} renderOptions - Th options for the media renderer
 */
export const MidiComponent = ({
  artifactUri,
  displayUri,
  previewUri,
  displayView,
  nft,
}: {
  artifactUri: string
  displayUri?: string
  previewUri?: string
  displayView?: boolean
  nft: any
}) => {
  const [midiUrl, setMidiUrl] = useState(previewUri ? previewUri : artifactUri)
  const [currentVolume, setCurrentVolume] = useState(100)
  const [play, setPlay] = useState(false)
  const [disableVolumeControl, setDisableVolumeControl] = useState(false)
  const audioPlayer = useRef<any>(null)

  const togglePlay = () => {
    setPlay(!play)
  }

  useEffect(() => {
    if (audioPlayer.current) {
      if (play) {
        audioPlayer.current.start()
      } else {
        audioPlayer.current.stop()
      }
    }
  }, [play])

  useEffect(() => {
    if (previewUri || artifactUri) {
      processMidiData(previewUri ? previewUri : artifactUri, currentVolume)
        .then((data: string) => {
          // Set the state with the new midi blob based on the adjusted volume
          setMidiUrl(data)
        })
        .catch((error) => {
          console.error('Error processing MIDI:', error)
        })
    }
  }, [previewUri, artifactUri, currentVolume])

  const updateVolume = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setCurrentVolume(parseInt((e.target as HTMLInputElement).value, 10))
  }, [])

  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.addEventListener('start', () => {
        setDisableVolumeControl(true)
      })

      audioPlayer.current.addEventListener('stop', () => {
        setDisableVolumeControl(false)
      })
    }
  }, [audioPlayer.current])

  return displayView ? (
    <div className={styles.container}>
      <img src={displayUri} alt={`cover for midi nft`} />

      <i>
        Please manually stop midi player before navigating out of this page.
      </i>

      <div className={styles.player_container}>
        <midi-player
          id="midi-player"
          ref={audioPlayer}
          src={midiUrl}
        ></midi-player>
        <div className={styles.volume_container}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="black"
            className="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
            />
          </svg>

          <input
            onInput={updateVolume}
            disabled={disableVolumeControl}
            type="range"
            min="1"
            max="100"
            value={currentVolume}
            className={styles.volume_slider}
            id="volume-slider"
          />
        </div>
      </div>
    </div>
  ) : (
    <div className={styles.feed_container}>
      <Button to={`${PATH.OBJKT}/${nft.token_id}`}>
        <img alt={`cover for midi object ${nft.token_id}`} src={displayUri} />
      </Button>

      <Button className={styles.button} onClick={togglePlay}>
        {play ? (
          <div className={styles.playerButton}>
            <PauseIcon fill="var(--gray-10)" width={64} height={64} />
            <i>
              Please manually stop midi player before navigating away from this
              page.
            </i>
          </div>
        ) : (
          <PlayIcon fill="var(--gray-10)" width={64} height={64} />
        )}
      </Button>

      <div id="feed-player" style={{ display: 'none' }}>
        <midi-player
          id="midi-player"
          ref={audioPlayer}
          src={midiUrl}
        ></midi-player>
      </div>
    </div>
  )
}

export default MidiComponent
