import styles from '@style'

export const Loading = ({ message }: { message?: string }) => {
  return (
    <div className={styles.container}>
      <div className={styles.loader}>
        <div className={styles.circle} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  )
}
