import { useEffect } from 'react'
import { createContext } from 'react'
import { useLocalStorage } from 'react-use'

export const LocalSettingsContext = createContext()

export const LocalSettingsProvider = (props) => {
  const [viewMode, setViewMode, rmViewMode] = useLocalStorage(
    'viewMode',
    'single'
  )
  const [nsfwFriendly, setNsfwFriendly, rmNsfwFriendly] = useLocalStorage(
    'nsfwFriendly',
    false
  )

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
      }}
    >
      {props.children}
    </LocalSettingsContext.Provider>
  )
}
