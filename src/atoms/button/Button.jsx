import classnames from 'classnames'
import styles from '@style'
import { /*Link*/ NavLink } from 'react-router-dom'
import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * Core button style (used for links, buttons, and <a>)
 * @param {Object} buttonProps
 * @param {string} buttonProps.to - If provided return a "NavLink"
 * @param {string} buttonProps.href - If provided return a "a"
 * @param {boolean} buttonProps.disabled - Disables the button
 * @param {boolean} buttonProps.fit - (Style) Fit
 * @param {boolean} buttonProps.full - (Style) Full
 * @param {boolean} buttonProps.shadow_box - (Style) Box (adds nesting)
 * @param {boolean} buttonProps.box - (Style) Box (adds nesting)
 * @param {string} buttonProps.className - Extra classes to apply to the button
 * @param {string} buttonProps.alt - Used for accessibility (aria-label)
 * @param {string} buttonProps.state - Additional state object passed to the Navlinks only.
 * @param {React.EffectCallback} buttonProps.onClick - onClick callback, ignore if to is provided
 * @param {React.EffectCallback} buttonProps.onTo - onClick for NavLinks
 * @param {React.ReactNode} buttonProps.children - children
 */
const Button = ({
  to = null,
  href = null,
  onClick = () => null,
  onTo = () => null,
  state,
  children,
  className,
  style,
  alt,
  disabled,
  selected,
  fit,
  full,
  box,
  shadow_box,
  secondary,
  small,
}) => {
  const _classes = classnames({
    [styles.container]: true,
    [styles.disabled]: disabled,
    [styles.fit]: fit,
    [styles.full]: full,
    [styles.small]: small,
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

  // if (to !== null) {
  //   return (
  //     <Link aria-label={alt} to={to} className={classes}>
  //       {children}
  //     </Link>
  //   )
  // }
  if (to !== null) {
    return (
      <NavLink
        aria-label={alt}
        to={to}
        state={state}
        onClick={onTo}
        className={({ isActive }) =>
          isActive ? `${styles.active} ${classes}` : classes
        }
        end
      >
        {children}
      </NavLink>
    )
  }

  if (href !== null) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-label={alt}
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
    >
      {children}
    </motion.button>
  )
}

export default Button
