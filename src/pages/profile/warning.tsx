import Button from '@atoms/button/Button'
import Checkbox from '@atoms/input/Checkbox'
import { useLocalSettings } from '@context/localSettingsStore'
import { useState } from 'react'
import styles from './warning.module.scss'

export const Warning = ({ onInteract }) => {
  const [remember, setRemember] = useState(false)
  const { setNsfwFriendly, setPhotosensitiveFriendly } = useLocalSettings(
    (st) => [st.setNsfwFriendly, st.setPhotosensitiveFriendly]
  )

  const handleInteract = (v) => {
    onInteract(v)
  }

  const onEnable = () => {
    if (remember) {
      console.log('disabling protections for good')
      setNsfwFriendly(true)
      setPhotosensitiveFriendly(true)
    }
    handleInteract(true)
  }

  const onSkip = () => {
    handleInteract(false)
  }
  return (
    <div className={styles.box}>
      <h1>Override Mode</h1>
      <div>
        <p>
          The override mode momentarily removes visual protections (NSFW and
          Flashing content)
        </p>
        <p>
          By clicking enable, those filters will be removed only for this
          profile
        </p>
        <p>
          You can tick the "Remember my choice" checkbox to make it effective
          across teia.
        </p>
        <p>
          If you ever need to change these, head to the local
          <Button inline strong to="/settings">
            settings
          </Button>
        </p>
      </div>
      <div className={styles.buttons}>
        <Button onClick={onSkip} data-id="skip" shadow_box>
          Skip
        </Button>
        <Button onClick={onEnable} data-id="enable" shadow_box>
          Enable
        </Button>
      </div>
      <Checkbox
        checked={remember}
        onCheck={setRemember}
        label="Remember my choice"
      ></Checkbox>
    </div>
  )
}
