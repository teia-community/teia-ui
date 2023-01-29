import React from 'react'
// import { PauseIcon, PlayIcon } from './icons'
// import { Visualiser } from './visualiser'
// import styles from '@style'

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
  // const [play, setPlay] = useState(false)
  // const togglePlay = () => {
  //   setUserTouched(true)
  //   setPlay(!play)
  // }

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
    <>
      <span>
        <img
          style={{ width: '100%' }}
          src={displayUri}
          alt={`cover for audio object ${nft.token_id}`}
        />
        <br />
        <audio
          style={{ width: '100%' }}
          src={previewUri ? previewUri : artifactUri}
          controls
        />
      </span>
    </>
  ) : (
    <div>
      <div>
        <img alt={`cover for audio object ${nft.token_id}`} src={displayUri} />
        <br />
        <audio
          style={{ display: 'block', margin: '0 auto' }}
          src={previewUri ? previewUri : artifactUri}
          controls
        />
      </div>
    </div>
  )
}

export default AudioComponent
