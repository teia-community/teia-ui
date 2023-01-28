import { useKeyboard } from '@hooks/use-keyboard'
import { DebugCenter } from './DebugCenter'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from '@style'

const LocalKey = ({ name }) => {
  return (
    <p>
      <strong>{name} -></strong> {localStorage.getItem(name)}
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
          <LocalKey name="settings:theme" />
          <LocalKey name="settings:nsfwFriendly" />
          <LocalKey name="settings:photosensitiveFriendly" />
          <LocalKey name="settings:viewMode" />
          <LocalKey name="settings:zen" />

          <LocalKey name="objkt:title" />
          <LocalKey name="objkt:description" />
          <LocalKey name="objkt:tags" />
          <LocalKey name="objkt:amount" />
          <LocalKey name="objkt:rights" />
          <LocalKey name="objkt:rights_uri" />
          <LocalKey name="objkt:royalties" />
          <LocalKey name="objkt:language" />

          <LocalKey name="language" />
          <LocalKey name="collab_name" />
          <LocalKey name="auth" />
          <LocalKey name="beacon:sdk_version" />
          <LocalKey name="beacon:active-account" />

          {/* {Object.keys(localStorage).map((k) => (
            <LocalKey name={k} />
          ))} */}
          <DebugCenter />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
