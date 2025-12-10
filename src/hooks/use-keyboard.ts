import { useEffect, useState } from 'react'
import { useMount, useUpdateEffect } from 'react-use'

type KeyHandler = (event?: KeyboardEvent) => void

export const useKeyboard = (
  combination: string | string[],
  keydown?: KeyHandler,
  keyup?: KeyHandler
) => {
  const [state, set] = useState<[boolean, KeyboardEvent | null]>([false, null])
  const [keyboardJs, setKeyboardJs] = useState<any>(null)

  useMount(() => {
    import('keyboardjs').then((k) => setKeyboardJs(k.default || k))
  })

  useEffect(() => {
    if (!keyboardJs) {
      return
    }

    const down = (event: KeyboardEvent) => set([true, event])
    const up = (event: KeyboardEvent) => set([false, event])
    keyboardJs.bind(combination, down, up, true)

    return () => {
      keyboardJs.unbind(combination, down, up)
    }
  }, [combination, keyboardJs])

  useUpdateEffect(() => {
    if (!state[0] && keyup) {
      keyup()
    } else if (state[0] && keydown) {
      keydown()
    }
  }, [state[0]])

  return state
}
