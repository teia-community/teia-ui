import classnames from 'classnames'
import styles from '@style'
import { NavLink, To } from 'react-router-dom'
import { motion } from 'framer-motion'
import React from 'react'

interface ButtonProps {
  /**Used for accessibility (aria-label) */
  alt?: string
  /** If provided return a "NavLink" */
  to?: To
  /** If provided return a "a" */
  href?: string
  /**onClick callback, ignore if to is provided */
  onClick?: () => void
  /**@deprecated onClick for NavLinks */
  onTo?: () => void
  children?: string | React.ReactNode
  /**Extra classes to apply to the button */
  className?: string
  style?: React.CSSProperties
  /** Disables the button */
  disabled?: boolean
  selected?: boolean
  /**(Style) Fit */
  fit?: boolean
  /**(Style) Full */
  full?: boolean
  /**(Style) Box (adds nesting) */
  box?: boolean
  strong?: boolean
  /**(Style) Shadow Box (adds nesting)*/
  shadow_box?: boolean
  secondary?: boolean
  small?: boolean
  inline?: boolean
  activeClass?: string
  //props
  [x: string]: any
}

/**
 * Core button style (used for links, buttons, and <a>)
 */
const Button = ({
  to,
  href,
  onClick,
  onTo,
  children,
  className,
  style,
  alt,
  disabled,
  selected,
  fit,
  full,
  box,
  strong,
  shadow_box,
  secondary,
  small,
  inline,
  activeClass,
  ...props
}: ButtonProps) => {
  const _classes = classnames({
    [styles.container]: true,
    [styles.disabled]: disabled,
    [styles.fit]: fit,
    [styles.full]: full,
    [styles.small]: small,
    [styles.strong]: strong,
    [styles.inline]: inline,

    [styles.selected]: selected,
    [styles.primary]: !secondary,
  })

  const classes = `${_classes} ${className ? className : ''}`

  // variants..
  if (box) {
    children = <div className={styles.box}>{children}</div>
  } else if (shadow_box) {
    children = <div className={styles.shadow_box}>{children}</div>
  }

  if (to != null) {
    return (
      <NavLink
        aria-label={alt}
        to={to}
        onClick={onTo}
        className={({ isActive }) =>
          isActive
            ? `${styles.active} ${classes} ${activeClass || ''}`
            : classes
        }
        {...props}
        end
      >
        {children}
      </NavLink>
    )
  }

  if (href != null) {
    return (
      <motion.a
        style={style}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-label={alt}
        {...props}
      >
        {children}
      </motion.a>
    )
  }
  return (
    <motion.button
      style={style}
      aria-label={alt}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default Button
