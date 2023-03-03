import { THEMES, THEME_OPTIONS } from '@constants'
import { type Theme, useLocalSettings } from '@context/localSettingsStore'
import Select, { type SelectProps } from './Base'

export const ThemeSelection = (
  props: Partial<SelectProps> & { apply: boolean }
) => {
  const theme = useLocalSettings((st) => st.theme)
  const setTheme = useLocalSettings((st) => st.setTheme)

  return (
    <Select
      alt="theme selection"
      value={{ label: THEMES[theme], value: theme }}
      onChange={(e) => setTheme(e.value as Theme, props.apply)}
      options={THEME_OPTIONS}
      {...props}
    />
  )
}
