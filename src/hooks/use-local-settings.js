import { useContext, useEffect } from 'react'
import { useLocalStorage } from './use-local-storage'
import { TeiaContext } from '@context/TeiaContext'

/**
 * Hook to manage local settings, i.e settings stored in local storage
 * @returns {SettingsData}
 */
export default function useLocalSettings(profile) {
  const { profileFeed, setViewMode } = useContext(TeiaContext)
  const [profileViewMode, setProfileViewMode] = useLocalStorage(
    'profileViewMode',
    'masonry'
  )
  const [feedViewMode, setfeedViewMode] = useLocalStorage(
    'feedViewMode',
    'single'
  )

  const current = {
    viewMode: profileFeed ? profileViewMode : feedViewMode,
    setViewMode: profileFeed ? setProfileViewMode : setfeedViewMode,
  }
  const syncToContext = (val) => {
    setViewMode(val)
    current.setViewMode(val)
  }

  useEffect(() => {
    syncToContext(current.viewMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.viewMode])
  return {
    viewMode: current.viewMode,
    setViewMode: syncToContext,
  }
}
