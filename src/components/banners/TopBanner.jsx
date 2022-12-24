import { useWindowScroll } from 'react-use'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import styles from '@style'

export const TopBanner = ({ children, color }) => {
  const [visible, setVisible] = useState(true)
  const { y } = useWindowScroll()

  useEffect(() => {
    setVisible(y < 50)
  }, [y])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: '50px', y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          style={{ backgroundColor: color }}
          className={styles.banner}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
