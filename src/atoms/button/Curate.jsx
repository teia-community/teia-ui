import styles from '@style'
import classnames from 'classnames'

export const Curate = ({ children = null, selected }) => {
  const classes = classnames({
    [styles.curate]: true,
    [styles.selected]: selected,
  })
  return <div className={classes}>{children}</div>
}
