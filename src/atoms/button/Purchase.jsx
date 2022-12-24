import classnames from 'classnames'
import { useContext } from 'react'
import { HicetnuncContext } from '@context/HicetnuncContext'
import styles from '@style'

export const Purchase = ({ children = null, selected }) => {
  const context = useContext(HicetnuncContext)

  const classes = classnames({
    [styles.purchase]: true,
    [styles.selected]: selected,
    [styles.dark]: context.theme === 'dark',
  })
  return <div className={classes}>{children}</div>
}
