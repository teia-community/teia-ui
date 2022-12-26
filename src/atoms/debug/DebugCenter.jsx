import { useKeyboard } from '@hooks/use-keyboard'

import styles from '@style'
import { useState } from 'react'
import React from 'react'
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = React.useState({ x: null, y: null })
  React.useEffect(() => {
    const updateMousePosition = (ev) => {
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
              top: trackY ? mouse.y - window.innerHeight / 2 : 'unset',
              left: trackX ? mouse.x - window.innerWidth / 2 : 'unset',
            }
          : {}
      }
      className={`${styles.debug_center} ${cross ? styles.cross : ''} ${
        fill ? styles.fill : ''
      }`}
    />
  )
}
