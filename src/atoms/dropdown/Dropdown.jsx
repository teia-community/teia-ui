import { useRef } from 'react'
import { AnimatePresence } from 'framer-motion'

import useBodyClass from '@hooks/use-body-class'
import styles from '@style'
import { motion } from 'framer-motion'
import { containerMenu } from '@utils/motion'
import { useClickOutside } from 'hooks/use-click-outside'
import classnames from 'classnames'
import React from 'react'

export function DropDown({ children, setOpen, vertical, menuID, left }) {
  useBodyClass('overlay')

  const dropdownRef = useRef(null)

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

export default DropDown
