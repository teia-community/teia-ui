import classnames from 'classnames'
import styles from '@style'

export const Line = ({ vertical, className, style }) => {
  const classes = classnames({
    [styles.vertical]: vertical,
    [styles.horizontal]: !vertical,
  })
  return (
    <hr style={style} className={`${className ? className : ''} ${classes} `} />
  )
}
