import { useEffect } from 'react'
import { useCallback } from 'react'
import { createContext } from 'react'
import { useLocalStorage } from 'react-use'

export const LocalSettingsContext = createContext()

export const LocalSettingsProvider = (props) => {
  const [viewMode, setViewMode, rmViewMode] = useLocalStorage(
    'settings:viewMode',
    'single'
  )
  const [nsfwFriendly, setNsfwFriendly, rmNsfwFriendly] = useLocalStorage(
    'settings:nsfwFriendly',
    false
  )

  const [theme, setTheme, rmTheme] = useLocalStorage('settings:theme', 'dark')

  const [zen, setZen, rmZen] = useLocalStorage('settings:zen', false)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  return (
    <LocalSettingsContext.Provider
      value={{
        viewMode,
        setViewMode,
        rmViewMode,
        nsfwFriendly,
        setNsfwFriendly,
        rmNsfwFriendly,
        zen,
        setZen,
        rmZen,
        theme,
        setTheme,
        rmTheme,
        toggleTheme,
      }}
    >
      {props.children}
    </LocalSettingsContext.Provider>
  )
}
