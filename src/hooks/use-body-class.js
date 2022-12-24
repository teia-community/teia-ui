import { useEffect } from 'react'

const addBodyClass = (className) => document.body.classList.add(className)
const removeBodyClass = (className) => document.body.classList.remove(className)

/**
 * Hook to add a class to the body from a mounted component (used by dropdowns to dim background)
 * @param {string} className The class name to add.
 */
export default function useBodyClass(className) {
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
