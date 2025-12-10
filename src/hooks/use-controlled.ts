import { useCallback, useRef, useState } from 'react'

export const useControlled = (controlled, initial) => {
  const controlledRef = useRef(false)
  controlledRef.current = controlled !== undefined

  const [uncontrolledValue, setUncontrolledValue] = useState(initial)

  const value = controlledRef.current ? controlled : uncontrolledValue

  const setValue = useCallback(
    (nextValue) => {
      if (!controlledRef.current) {
        setUncontrolledValue(nextValue)
      }
    },
    [controlledRef]
  )

  return [value, setValue, controlledRef.current]
}
