/* eslint-disable react-hooks/exhaustive-deps */
import { Page } from '@atoms/layout'
import { Checkbox } from '@atoms/input'
import styles from '@style'
import useLocalSettings from '@hooks/use-local-settings'
import Select from '@atoms/select'
import { THEMES, THEME_OPTIONS } from '@constants'
import { Line } from '@atoms/line'

export const Settings = () => {
  const {
    theme,
    setTheme,
    nsfwFriendly,
    setNsfwFriendly,
    photosensitiveFriendly,
    setPhotosensitiveFriendly,
  } = useLocalSettings()

  return (
    <Page>
      <div className={styles.info}>
        <h1>Local Settings</h1>
        <p>
          Those settings are non portable and only stored in your current
          browser cache.
        </p>
        <Line className={styles.title_line} />
      </div>
      <div className={styles.localSettings}>
        <div className={styles.fields}>
          <Checkbox
            alt={`click to ${
              nsfwFriendly ? 'disable' : 'enable'
            } the bluring of NSFW tokens on feeds`}
            checked={nsfwFriendly}
            onCheck={setNsfwFriendly}
            label={'Allow NSFW on feeds'}
          />
          <Checkbox
            alt={`click to ${
              photosensitiveFriendly ? 'disable' : 'enable'
            } the bluring of photosensitive tokens on feeds`}
            checked={photosensitiveFriendly}
            onCheck={setPhotosensitiveFriendly}
            label={'Allow Photosensitive on feeds'}
          />
          <Select
            alt="theme selection"
            label="Theme"
            value={{ label: THEMES[theme], value: theme }}
            onChange={(e) => setTheme(e.value)}
            options={THEME_OPTIONS}
          />
        </div>
      </div>
    </Page>
  )
}
