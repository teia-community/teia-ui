import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { HicetnuncContext } from '../../context/HicetnuncContext'
import classnames from 'classnames'
import styles from './styles.module.scss'

export const Button = ({
  to = null,
  href = null,
  onClick = () => null,
  children,
  disabled,
  fit,
  full,
}) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.disabled]: disabled,
    [styles.fit]: fit,
    [styles.full]: full,
  })

  if (to) {
    return (
      <Link to={to} className={classes}>
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
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  )
}

export const Primary = (props) => {
  //{ children = null, selected, menu, left, label = '' }) => {
  const classes = classnames({
    [styles.primary]: true,
    [styles.selected]: props.selected,
    [styles.menu]: props.menu,
    [styles.left]: props.left,
  })
  return (
    <div className={classes} role="button" aria-label={props.label}>
      {props.children}
    </div>
  )
}

export const Secondary = ({ children = null, selected, label = '' }) => {
  const classes = classnames({
    [styles.secondary]: true,
    [styles.selected]: selected,
  })
  return (
    <div className={classes} role="button" aria-label={label}>
      {children}
    </div>
  )
}

export const Purchase = ({ children = null, selected }) => {
  const context = useContext(HicetnuncContext)

  const classes = classnames({
    [styles.purchase]: true,
    [styles.selected]: selected,
    [styles.dark]: context.theme === 'dark',
  })
  return <div className={classes}>{children}</div>
}

export const Curate = ({ children = null, selected }) => {
  const classes = classnames({
    [styles.curate]: true,
    [styles.selected]: selected,
  })
  return <div className={classes}>{children}</div>
}
