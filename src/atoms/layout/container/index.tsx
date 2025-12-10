import classnames from 'classnames'
import styles from '@style'
import { memo, ReactNode } from 'react'

type ContainerProps = {
  children?: ReactNode
  large?: boolean
  xlarge?: boolean
}

const Container = ({ children = null, large = false, xlarge = false }: ContainerProps) => {
  const classes = classnames({
    [styles.container]: true,
    [styles.large]: large,
    [styles.xlarge]: xlarge,
  })
  return <div className={classes}>{children}</div>
}

export default memo(Container)
