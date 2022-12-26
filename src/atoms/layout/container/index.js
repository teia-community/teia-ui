import React from 'react'
import classnames from 'classnames'
import styles from '@style'

export const Container = ({
  children = null,
  large = false,
  xlarge = false,
}) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.large]: large,
    [styles.xlarge]: xlarge,
  })
  return <div className={classes}>{children}</div>
}
