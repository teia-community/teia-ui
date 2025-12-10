import { useEffect } from 'react'

/**
 * Hook to detect clicks outside the current component
 * @param {*} ref The reference object
 * @param {*} callback The callback to call when we clicked outside.
 * @param {boolean} ignore_parent If true, clicking on the direct parent won't trigger the callback.
 */
export const useClickOutside = (ref: React.RefObject<HTMLElement>, callback: () => void, ignore_parent = false) => {
  const onClickOut = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      if (ignore_parent) {
        if (ref.current.parentElement && !ref.current.parentElement.contains(event.target as Node)) {
          callback()
        }
      } else {
        callback()
      }
    }
  }
  useEffect(() => {
    document.addEventListener('mousedown', onClickOut)
    return () => {
      document.removeEventListener('mousedown', onClickOut)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
