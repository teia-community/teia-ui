import classnames from 'classnames'
import styles from '@style'
import { memo } from 'react'

const Container = ({ children = null, large = false, xlarge = false }) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.large]: large,
    [styles.xlarge]: xlarge,
  })
  return <div className={classes}>{children}</div>
}

export default memo(Container)
