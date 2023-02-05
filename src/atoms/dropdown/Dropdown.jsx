import { memo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'

import useBodyClass from '@hooks/use-body-class'
import styles from '@style'
import { motion } from 'framer-motion'
import { containerMenu } from '@utils/motion'
import { useClickOutside } from '@hooks/use-click-outside'
import classnames from 'classnames'
import { useTwemoji } from '@hooks/use-twemoji'

function DropDown({ children, setOpen, vertical, menuID, left }) {
  useBodyClass('overlay')

  const dropdownRef = useRef(null)
  useTwemoji()
  useClickOutside(
    dropdownRef,
    () => {
      setOpen(false)
    },
    true
  )

  const classes = classnames({
    [styles.dropdown_container]: true,
    [styles.vertical]: vertical,
    [styles.left]: left,
  })

  return (
    <motion.div
      className={classes}
      initial="hidden"
      animate="show"
      variants={containerMenu}
      id={menuID || 'dropdown'}
      ref={dropdownRef}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </motion.div>
  )
}

export default memo(DropDown)
