import React from 'react'
import styles from '@style'
import { memo } from 'react'

const VisuallyHidden = ({ children = null, as: Comp = 'span' }) => {
  return <Comp className={styles.container}>{children}</Comp>
}

export default memo(VisuallyHidden)
