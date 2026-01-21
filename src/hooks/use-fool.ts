import { useEffect } from 'react'
import { useLocalSettings } from '@context/localSettingsStore'

/**
 * Hook for april's fool day, it randomly rotates the style of all elements
 *
 */

export default function useFool(minRotation = -2, maxRotation = 2) {
  const [foolAround] = useLocalSettings((t) => [t.tilted])
  useEffect(() => {
    let styleEl = document.getElementById('page-styles')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.setAttribute('id', 'page-styles')
      document.head.appendChild(styleEl)
    }

    let stylesheet = ''
    if (foolAround) {
      let value = 0
      while (Math.abs(value) < 0.3) {
        value = Math.random() * (maxRotation - minRotation) + minRotation
      }
      stylesheet = `*:not(.no-fool):not([id^="beacon-alert-wrapper-"]):not(main):not(body):not(html):not(#root) { transition: transform 500ms; rotate:${value}deg; }`
    }

    styleEl.innerHTML = stylesheet
  }, [foolAround, minRotation, maxRotation])
}
