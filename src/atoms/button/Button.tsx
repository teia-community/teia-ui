import classnames from 'classnames'
import styles from '@style'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import type React from 'react'

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
