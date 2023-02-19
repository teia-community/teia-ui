import React, { memo, useState } from 'react'
import styles from '@style'
import { AnimatePresence, motion } from 'framer-motion'
import classnames from 'classnames'
import Button from '@atoms/button/Button'
import { useTwemoji } from '@hooks/use-twemoji'
interface DropdownButtonProps {
  menuID: string
  direction: 'left' | 'right'
  label: string
  alt: string
  icon?: React.ReactNode
  toggled: boolean
  children: React.ReactNode
  onClick: () => void
  className?: string
}

interface ChildProps {
  left?: boolean
}

function DropdownButton({
  menuID,
  direction = 'right',
  label,
  alt,
  icon,
  toggled,
  children,
  onClick,
  className,
}: DropdownButtonProps) {
  const [open, setOpen] = useState(false)

  useTwemoji()

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
  const props: ChildProps = {}
  if (direction === 'left') {
    props.left = true
  }
  return (
    <motion.div className={`${className ? className : ''} ${containerClasses}`}>
      <Button
        alt={alt}
        className={classes}
        data-toggle={menuID}
        onClick={() => {
          toggle()
          if (onClick) onClick()
        }}
      >
        <>
          {label}
          {icon}
        </>
      </Button>
      <AnimatePresence>
        {children &&
          open &&
          React.cloneElement(children, { setOpen, ...props })}
      </AnimatePresence>
    </motion.div>
  )
}

export default memo(DropdownButton)
