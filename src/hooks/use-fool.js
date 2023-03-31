import { useEffect } from 'react'
import { useLocalSettings } from '@context/localSettingsStore'

/**
 * Hook for april's fool day, it randomly rotates the style of all elements
 *
 */

export default function useFool() {
  const [foolAround] = useLocalSettings((t) => [t.foolAround])
  useEffect(() => {
    let styleEl = document.getElementById('page-styles')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.setAttribute('id', 'page-styles')
      document.head.appendChild(styleEl)
    }

    let stylesheet = ''
    if (foolAround) {
      const maxRotation = 2
      const minRotation = -2
      const value =
        Math.floor(Math.random() * (maxRotation - minRotation + 1)) +
        minRotation
      stylesheet = `*:not(.no-fool):not([id^="beacon-alert-wrapper-"]):not(main):not(body):not(html):not(#root) { transition: transform 500ms; rotate:${value}deg; }`
    }

    styleEl.innerHTML = stylesheet
  }, [foolAround])
}
