import { memo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'

import useBodyClass from '@hooks/use-body-class'
import styles from '@style'
import { motion } from 'framer-motion'
import { containerMenu } from '@utils/motion'
import { useClickOutside } from '@hooks/use-click-outside'
import classnames from 'classnames'
import { useTwemoji } from '@hooks/use-twemoji'

interface DropdownProps {
  menuID: string
  /** Callback when dropdown closed/clicked outside */
  setOpen: (isOpen: boolean) => void
  children: JSX.Element | JSX.Element[]
  vertical?: boolean
  left?: boolean
}

function DropDown({
  children,
  setOpen,
  vertical,
  menuID,
  left,
}: DropdownProps) {
  useBodyClass('overlay')
  const dropdownRef = useRef<HTMLDivElement>(null)

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
