import classnames from 'classnames'
import styles from '@style'

export const Line = ({ vertical }) => {
  const classes = classnames({
    [styles.vertical]: vertical,
    [styles.horizontal]: !vertical,
  })
  return <span className={classes} />
}
