import { useCallback, useRef, useState } from 'react'

export const useControlled = <T>(controlled: T | undefined, initial: T) => {
  const controlledRef = useRef(false)
  controlledRef.current = controlled !== undefined

  const [uncontrolledValue, setUncontrolledValue] = useState(initial)

  const value = controlledRef.current ? controlled : uncontrolledValue

  const setValue = useCallback(
    (nextValue: T) => {
      if (!controlledRef.current) {
        setUncontrolledValue(nextValue)
      }
    },
    [controlledRef]
  )

  return [value, setValue, controlledRef.current] as const
}
