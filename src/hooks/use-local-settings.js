import { LocalSettingsContext } from '@context/LocalSettings'
import { useContext } from 'react'

/**
 *
 * @returns {import("@types").LocalSettingsContext}
 */
export default function useLocalSettings() {
  return useContext(LocalSettingsContext)
}
