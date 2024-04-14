import { useCallback, useEffect, useRef, useState } from 'react'
// import { Visualiser } from './visualiser'
import styles from '@style'
import { PlayIcon, PauseIcon } from '@icons'
import Button from '@atoms/button/Button'
import { PATH } from '@constants'
import MidiPlayer from 'react-midi-player'
import { JZZ } from 'jzz'
import { getMidiUrlData } from '@utils/media'

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
  const [midiPlayerInstance, setMidiPlayerInstance] = useState()
  const [midiData, setMidiData] = useState()

  const togglePlay = () => {
    setPlay(!play)
  }

  useEffect(() => {
    const getMidiDatastring = async () => {
      let data = await getMidiUrlData(previewUri ? previewUri : artifactUri)
      let smf = new JZZ.MIDI.SMF(JZZ.lib.fromBase64(data))
      setMidiData(smf)
    }

    if (!displayView && !midiPlayerInstance && midiData) {
      let player = new JZZ.gui.Player('player')
      player.load(midiData)
      setMidiPlayerInstance(player)
    }

    if (!midiPlayerInstance && !midiData) {
      getMidiDatastring()
    }
  }, [artifactUri, previewUri, midiData, midiPlayerInstance, midiData])

  useEffect(() => {
    if (midiPlayerInstance && midiData) {
      if (play) {
        midiPlayerInstance.play()
      } else {
        midiPlayerInstance.pause()
      }
    }
  }, [play, midiPlayerInstance, midiData])

  return displayView ? (
    <div className={styles.container}>
      <img src={displayUri} alt={`cover for midi nft`} />

      <i>
        Please manually stop midi player before navigating out of this page.
      </i>

      <MidiPlayer src={previewUri ? previewUri : artifactUri} />
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
      <div id="player" style={{ display: 'none' }}></div>
    </div>
  )
}

export default MidiComponent
