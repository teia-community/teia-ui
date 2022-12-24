import { useKeyboard } from '@hooks/use-keyboard'
import { DebugCenter } from './DebugCenter'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from '@style'

const LocalKey = ({ name }) => {
  return (
    <p>
      <strong>{name}:</strong> {localStorage.getItem(name)}
    </p>
  )
}

export const Debug = () => {
  const [show, setShow] = useState(false)
  useKeyboard('shift + d', () => setShow(!show))

  const v = {
    show: {
      x: 0,
      opacity: 1,
    },
    hidden: {
      x: -100,
      opacity: 0,
    },
  }
  return (
    <AnimatePresence>
      {show && (
        <motion.div variants={v} className={styles.debug}>
          <h1>DEBUG</h1>
          <LocalKey name="theme" />
          <LocalKey name="language" />
          <LocalKey name="auth" />
          {/* {Object.keys(localStorage).map((k) => (
            <LocalKey name={k} />
          ))} */}
          <DebugCenter />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
