import styles from '@style'

type LoadingProps = {
  message?: string
}

export const Loading = ({ message }: LoadingProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.loader}>
        <div className={styles.circle} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  )
}
