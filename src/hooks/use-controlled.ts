import { useCallback, useRef, useState } from 'react'

export const useControlled = <T>(
  controlled?: T,
  initial?: T
): [val: T | undefined, setVal: (arg: T) => void, controlled: boolean] => {
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

  return [value, setValue, controlledRef.current]
}
