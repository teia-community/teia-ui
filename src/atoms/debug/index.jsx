import { useKeyboard } from '@hooks/use-keyboard'
import { DebugCenter } from './DebugCenter'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from '@style'
import { Line } from '@atoms/line'
import { useInterval } from 'react-use'
import { get } from 'lodash'
import { useUserStore } from '@context/userStore'
const LocalKey = ({ name }) => {
  return (
    <p>
      <span className={styles.name}>{`${name} -> `}</span>
      {localStorage.getItem(name)}
    </p>
  )
}

export const Debug = () => {
  const [show, setShow] = useState(false)
  useKeyboard('shift + d', () => setShow(!show))
  const userStore = useUserStore()
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
  const [count, setCount] = useState(0)

  // Re-render the component every 300ms (to re-read the storage)
  useInterval(() => {
    setCount(count + 1)
  }, 300)

  const ContextValue = ({ name }) => {
    return (
      <p>
        <span className={styles.name}>{`${name} -> `}</span>
        {JSON.stringify(get(userStore, name))}
      </p>
    )
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div variants={v} className={styles.debug}>
          <h3>DEBUG ({count} ticks)</h3>
          <div className={styles.storage}>
            <h3>Local Settings Storage</h3>
            <LocalKey name="settings:theme" />
            <LocalKey name="settings:nsfwFriendly" />
            <LocalKey name="settings:photosensitiveFriendly" />
            <LocalKey name="settings:viewMode" />
            <LocalKey name="settings:zen" />
            <Line />
            <h3>Mint Fields Storage</h3>
            <LocalKey name="objkt:title" />
            <LocalKey name="objkt:description" />
            <LocalKey name="objkt:tags" />
            <LocalKey name="objkt:amount" />
            <LocalKey name="objkt:rights" />
            <LocalKey name="objkt:rights_uri" />
            <LocalKey name="objkt:royalties" />
            <LocalKey name="objkt:language" />
            <LocalKey name="objkt:nsfw" />
            <LocalKey name="objkt:photosensitiveSeizureWarning" />

            <Line />
            <h3>Context Extra Storage</h3>
            <LocalKey name="language" />
            <LocalKey name="collab_name" />
            <LocalKey name="beacon:sdk_version" />
            <LocalKey name="beacon:active-account" />

            <Line />
            <h3>Context Debug</h3>
            <ContextValue name="userInfo" />
            <ContextValue name="address" />
            <ContextValue name="proxyAddress" />
            <ContextValue name="proxyName" />
          </div>
          {/* {Object.keys(localStorage).map((k) => (
            <LocalKey name={k} />
          ))} */}
          <DebugCenter />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
