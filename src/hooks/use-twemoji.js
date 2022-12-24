import { useEffect } from 'react'

/**
 * Hook to ensure emojis are properly rendered for the current document
 */
export function useTwemoji() {
  useEffect(() => {
    window.twemoji.parse(
      document.body,
      { folder: 'svg', ext: '.svg' } // This is to specify to Twemoji to use SVGs and not PNGs
    )
  }, [])
}
