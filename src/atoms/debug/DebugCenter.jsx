import { useKeyboard } from '@hooks/use-keyboard'

import styles from '@style'
import { useState } from 'react'

export const DebugCenter = () => {
  const [cross, setCross] = useState(false)
  const [fill, setFill] = useState(false)

  useKeyboard(
    'c',
    () => setCross(true),
    () => setCross(false)
  )
  useKeyboard(
    'f',
    () => setFill(true),
    () => setFill(false)
  )
  return (
    <div
      className={`${styles.debug_center} ${cross ? styles.cross : ''} ${
        fill ? styles.fill : ''
      }`}
    />
  )
}
