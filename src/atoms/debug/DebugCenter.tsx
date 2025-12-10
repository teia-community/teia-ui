import { useKeyboard } from '@hooks/use-keyboard'

import styles from '@style'
import { useState, useEffect } from 'react'

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY })
    }
    window.addEventListener('mousemove', updateMousePosition)
    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [])
  return mousePosition
}

export const DebugCenter = () => {
  const [cross, setCross] = useState(false)
  const [fill, setFill] = useState(false)
  const [track, setTrack] = useState(false)
  const [trackX, setTrackX] = useState(false)
  const [trackY, setTrackY] = useState(true)
  const mouse = useMousePosition()

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
  useKeyboard('t', () => setTrack(!track))
  useKeyboard('x', () => setTrackX(!trackX))
  useKeyboard('y', () => setTrackY(!trackY))

  return (
    <div
      style={
        track
          ? {
            top: trackY && mouse.y !== null ? mouse.y - window.innerHeight / 2 : 'unset',
            left: trackX && mouse.x !== null ? mouse.x - window.innerWidth / 2 : 'unset',
          }
          : {}
      }
      className={`${styles.debug_center} ${cross ? styles.cross : ''} ${fill ? styles.fill : ''
        }`}
    />
  )
}
