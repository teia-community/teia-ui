import styles from '@style'
import { memo } from 'react'

export const Loading = memo(({ message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.loader}>
        <div className={styles.circle} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  )
})
