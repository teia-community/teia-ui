import { useEffect } from 'react'
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

  const [zen, setZen, rmZen] = useLocalStorage('settings:zen', false)

  useEffect(() => {
    console.log(viewMode)
  }, [viewMode])

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
      }}
    >
      {props.children}
    </LocalSettingsContext.Provider>
  )
}
