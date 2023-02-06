import { useEffect } from 'react'

/**
 * Hook to ensure emojis are properly rendered for the current document
 */
export function useTwemoji() {
  useEffect(() => {
    if (window.twemoji)
      window.twemoji.parse(document.body, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
      })
  }, [])
}
