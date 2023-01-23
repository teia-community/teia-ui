import React from 'react'
import styles from '@style'
import { memo } from 'react'

export const Loading = memo(({ message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.circle} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
})

export const LoadingContainer = memo(({ loading, children = null }) => {
  if (loading) {
    return (
      <div className={styles.loader}>
        <Loading />
      </div>
    )
  }
  return children
})
