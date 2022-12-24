import React from 'react'
import styles from '@style'

export const BottomBanner = ({ children = null }) => {
  return <div className={styles.bottom_banner}>{children}</div>
}
