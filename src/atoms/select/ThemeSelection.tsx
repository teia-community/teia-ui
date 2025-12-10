import { THEMES, THEME_OPTIONS } from '@constants'
import { useLocalSettings } from '@context/localSettingsStore'
import Select from './Base'

interface ThemeSelectionProps {
  apply?: boolean
  [key: string]: any
}

export const ThemeSelection = (props: ThemeSelectionProps) => {
  const theme = useLocalSettings((st) => st.theme)
  const setTheme = useLocalSettings((st) => st.setTheme)

  return (
    <Select
      alt="theme selection"
      value={{ label: THEMES[theme], value: theme }}
      onChange={(e: any) => setTheme(e.value, props.apply)}
      options={THEME_OPTIONS}
      {...props}
    />
  )
}
