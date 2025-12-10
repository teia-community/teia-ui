import { THEMES, THEME_OPTIONS } from '@constants'
import { useLocalSettings } from '@context/localSettingsStore'
import Select from './Base'

export const ThemeSelection = (props) => {
  const theme = useLocalSettings((st) => st.theme)
  const setTheme = useLocalSettings((st) => st.setTheme)

  return (
    <Select
      alt="theme selection"
      value={{ label: THEMES[theme], value: theme }}
      onChange={(e) => setTheme(e.value, props.apply)}
      options={THEME_OPTIONS}
      {...props}
    />
  )
}
