import { LocalSettingsContext } from '@context/LocalSettingsProvider'
import { useContext } from 'react'

/**
 *
 * @returns {import("@types").LocalSettingsContext}
 */
export default function useLocalSettings() {
  return useContext(LocalSettingsContext)
}
