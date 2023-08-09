import { useEffect } from 'react'

/**
 * Hook to detect clicks outside the current component
 * @param {*} ref The reference object
 * @param {*} callback The callback to call when we clicked outside.
 * @param {boolean} ignore_parent If true, clicking on the direct parent won't trigger the callback.
 */
export const useClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  callback: () => void,
  ignore_parent = false
) => {
  const onClickOut = (event: MouseEvent) => {
    if ((ref?.current as T) && !ref?.current?.contains(event.target as T)) {
      if (ignore_parent) {
        if (!ref.current?.parentElement?.contains(event.target as T)) {
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
