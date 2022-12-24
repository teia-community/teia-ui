import { useEffect, useState } from 'react'

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initial
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initial
      return item ? JSON.parse(item) : initial
    } catch (error) {
      // If error also return initial
      console.log(error)
      return initial
    }
  })
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const set = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(value) : value
      // Save state
      setValue(valueToStore)
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error)
    }
  }
  const onStorage = (ev) => {
    setValue(ev.newValue)
  }
  useEffect(() => {
    window.addEventListener('storage', onStorage)

    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return [value, set]
}
