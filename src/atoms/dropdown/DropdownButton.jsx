import React, { memo, useState } from 'react'
import styles from '@style'
import { AnimatePresence, motion } from 'framer-motion'
import classnames from 'classnames'

function DropdownButton({
  menuID,
  direction = 'right',
  label,
  icon,
  toggled,
  children,
  onClick,
  className,
}) {
  const [open, setOpen] = useState(false)

  const toggle = () => {
    setOpen(!open)
  }

  const classes = classnames({
    [styles.header_button]: true,
    [styles.header_button_open]: open,
    [styles.header_button_toggled]: toggled,
  })

  const containerClasses = classnames({
    [styles.menu_left]: direction === 'left',
  })
  const props = {}
  if (direction === 'left') {
    props.left = true
  }
  return (
    <motion.div className={`${className ? className : ''} ${containerClasses}`}>
      <motion.button
        className={`${classes} `}
        data-toggle={menuID}
        onClick={() => {
          toggle()
          if (onClick) onClick()
        }}
      >
        {label}
        {icon}
      </motion.button>
      <AnimatePresence>
        {children &&
          open &&
          React.cloneElement(children, { setOpen, ...props })}
      </AnimatePresence>
    </motion.div>
  )
}

export default memo(DropdownButton)
