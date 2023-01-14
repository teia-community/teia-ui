import { LocalSettingsContext } from '@context/LocalSettingsProvider'
import { useContext } from 'react'

export default function useLocalSettings() {
  return useContext(LocalSettingsContext)
}
