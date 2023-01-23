import Button from '@atoms/button/Button'
import styles from '@style'
import classnames from 'classnames'

export function Tab({ children, to, selected }) {
  const classes = classnames({
    [styles.tab]: true,
    [styles.selected]: selected,
  })

  return (
    <Button className={classes} to={to} selected={selected}>
      {children}
    </Button>
  )
}
