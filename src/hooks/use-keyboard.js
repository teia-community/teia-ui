import { useEffect, useState } from 'react'
import { useMount, useUpdateEffect } from 'react-use'

export const useKeyboard = (combination, keydown, keyup) => {
  const [state, set] = useState([false, null])
  const [keyboardJs, setKeyboardJs] = useState(null)

  useMount(() => {
    import('keyboardjs').then((k) => setKeyboardJs(k.default || k))
  })

  useEffect(() => {
    if (!keyboardJs) {
      return
    }

    const down = (event) => set([true, event])
    const up = (event) => set([false, event])
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
