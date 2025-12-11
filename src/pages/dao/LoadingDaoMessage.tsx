import { Loading } from '@atoms/loading'
import styles from '@style'

export default function LoadingDaoMessage({ message }: { message?: string }) {
  return (
    <div className={styles.loading_containter}>
      <Loading message={message ?? 'Loading DAO information'} />
    </div>
  )
}
