import classnames from 'classnames'
import styles from '@style'
import { memo, ReactNode } from 'react'

type SecondaryProps = {
  children: ReactNode
  selected?: boolean
  label?: string
}

const Secondary = ({ children, selected, label = '' }: SecondaryProps) => {
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
