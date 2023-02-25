import { useEffect } from 'react'

const addBodyClass = (className: string) =>
  document.body.classList.add(className)
const removeBodyClass = (className: string) =>
  document.body.classList.remove(className)

/**
 * Hook to add a class to the body from a mounted component (used by dropdowns to dim background)
 * @param {string} className The class name to add.
 */
export default function useBodyClass(className: string | string[]) {
  useEffect(() => {
    // Set up
    className instanceof Array
      ? className.map(addBodyClass)
      : addBodyClass(className)

    // Clean up
    return () => {
      className instanceof Array
        ? className.map(removeBodyClass)
        : removeBodyClass(className)
    }
  }, [className])
}
