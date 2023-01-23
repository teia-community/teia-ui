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
  const [
    photosensitiveFriendly,
    setPhotosensitiveFriendly,
    rmPhotosensitiveFriendly,
  ] = useLocalStorage('settings:photosensitiveFriendly', false)

  const [theme, setTheme, rmTheme] = useLocalStorage('settings:theme', 'dark')
  const [zen, setZen, rmZen] = useLocalStorage('settings:zen', false)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
  }, [theme])

  const toggleZen = useCallback(() => {
    setZen(!zen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zen])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'single' ? 'masonry' : 'single')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

  return (
    <LocalSettingsContext.Provider
      value={{
        viewMode,
        setViewMode,
        rmViewMode,
        toggleViewMode,
        nsfwFriendly,
        setNsfwFriendly,
        rmNsfwFriendly,
        photosensitiveFriendly,
        setPhotosensitiveFriendly,
        rmPhotosensitiveFriendly,
        zen,
        setZen,
        rmZen,
        toggleZen,
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
