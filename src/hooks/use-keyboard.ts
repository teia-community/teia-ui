import type keyboardjs from 'keyboardjs'
import { useEffect, useState } from 'react'
import { useMount, useUpdateEffect } from 'react-use'

export const useKeyboard = (
  combination: string,
  keydown?: () => void,
  keyup?: () => void
) => {
  const [state, set] = useState<[boolean, keyboardjs.KeyEvent | undefined]>([
    false,
    undefined,
  ])
  const [keyboardJs, setKeyboardJs] = useState<typeof keyboardjs | null>(null)

  useMount(() => {
    import('keyboardjs').then((k) => setKeyboardJs(k.default || k))
  })

  useEffect(() => {
    if (!keyboardJs) {
      return
    }

    const down = (event?: keyboardjs.KeyEvent) => set([true, event])
    const up = (event?: keyboardjs.KeyEvent) => set([false, event])
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
