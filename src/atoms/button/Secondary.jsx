import classnames from 'classnames'
import styles from '@style'
import { memo } from 'react'

const Secondary = ({ children, selected, label = '' }) => {
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

export default memo(Secondary)
