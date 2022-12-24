import React from 'react'
import styles from '@style'

export const Padding = ({ children = null }) => {
  return <div className={styles.container}>{children}</div>
}
