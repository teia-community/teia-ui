/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import { Page } from '@atoms/layout'
import { Checkbox } from '@atoms/input'
import styles from '@style'
import useLocalSettings from '@hooks/use-local-settings'
import Select from '@atoms/select/index'
import { THEMES, THEME_OPTIONS } from '@constants'
import { Line } from '@atoms/line/index'

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
            checked={nsfwFriendly}
            onCheck={setNsfwFriendly}
            label={'Allow NSFW on feeds'}
          />
          <Checkbox
            checked={photosensitiveFriendly}
            onCheck={setPhotosensitiveFriendly}
            label={'Allow Photosensitive on feeds'}
          />
          <Select
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
