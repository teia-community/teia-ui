import classnames from 'classnames'
import styles from '@style'

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
