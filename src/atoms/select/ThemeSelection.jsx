import { THEMES, THEME_OPTIONS } from '@constants'
import useLocalSettings from '@hooks/use-local-settings'
import Select from './Base'

export const ThemeSelection = (props) => {
  const { theme, setTheme } = useLocalSettings()
  return (
    <Select
      alt="theme selection"
      value={{ label: THEMES[theme], value: theme }}
      onChange={(e) => setTheme(e.value)}
      options={THEME_OPTIONS}
      {...props}
    />
  )
}
