import { useEffect } from 'react'

/**
 * Hook to detect clicks outside the current component
 * @param {*} ref The reference object
 * @param {*} callback The callback to call when we clicked outside.
 * @param {boolean} ignore_parent If true, clicking on the direct parent won't trigger the callback.
 */
export const useClickOutside = (ref, callback, ignore_parent = false) => {
  const onClickOut = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      if (ignore_parent) {
        if (!ref.current.parentElement.contains(event.target)) {
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
