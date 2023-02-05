import styles from '@style'
import { memo } from 'react'

const BottomBanner = ({ children = null }) => {
  return <div className={styles.bottom_banner}>{children}</div>
}

export default memo(BottomBanner)
