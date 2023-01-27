import classnames from 'classnames'
import styles from '@style'
import { Link } from 'react-router-dom'
import { memo } from 'react'

/**
 * Core button style (used for links, buttons, and <a>)
 * @param {Object} buttonProps
 * @param {string} buttonProps.to - If provided return a "Link"
 * @param {string} buttonProps.href - If provided return a "a"
 * @param {boolean} buttonProps.disabled - Disables the button
 * @param {boolean} buttonProps.fit - (Style) Fit
 * @param {boolean} buttonProps.full - (Style) Full
 * @param {boolean} buttonProps.shadow_box - (Style) Box (adds nesting)
 * @param {boolean} buttonProps.box - (Style) Box (adds nesting)
 * @param {string} buttonProps.className - Extra classes to apply to the button
 * @param {string} buttonProps.alt - Used for accessibility (aria-label)
 * @param {React.EffectCallback} buttonProps.onClick - onClick callback
 * @param {React.ReactNode} buttonProps.children - children
 *
 */
const Button = ({
  to = null,
  href = null,
  onClick = () => null,
  children,
  alt,
  disabled,
  fit,
  full,
  box,
  shadow_box,
  className,
}) => {
  const _classes = classnames({
    [styles.container]: true,
    [styles.disabled]: disabled,
    [styles.fit]: fit,
    [styles.full]: full,
  })

  const classes = `${_classes} ${className ? className : ''}`

  // variants..
  if (box) {
    children = <div className={styles.box}>{children}</div>
  } else if (shadow_box) {
    children = <div className={styles.shadow_box}>{children}</div>
  }

  if (to !== null) {
    return (
      <Link aria-label={alt} to={to} className={classes}>
        {children}
      </Link>
    )
  }

  if (href !== null) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-label={alt}
      >
        {children}
      </a>
    )
  }
  return (
    <button aria-label={alt} onClick={onClick} className={classes}>
      {children}
    </button>
  )
}

export default memo(Button)
