import classnames from 'classnames'
import styles from '@style'
import { Link } from 'react-router-dom'

export const Button = ({
  to = null,
  href = null,
  onClick = () => null,
  children,
  disabled,
  fit,
  full,
  className,
}) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.disabled]: disabled,
    [styles.fit]: fit,
    [styles.full]: full,
  })

  if (to) {
    return (
      <Link to={to} className={`${classes} ${className || ''}`}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} onKeyDown={onClick} className={classes}>
      {children}
    </button>
  )
}
