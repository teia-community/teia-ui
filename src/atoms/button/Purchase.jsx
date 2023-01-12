import classnames from 'classnames'
import styles from '@style'

export const Purchase = ({ children = null, selected }) => {
  const classes = classnames({
    [styles.purchase]: true,
    [styles.selected]: selected,
  })
  return <div className={classes}>{children}</div>
}
