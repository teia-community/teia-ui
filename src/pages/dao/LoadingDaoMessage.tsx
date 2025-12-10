import { Loading } from '@atoms/loading'
import styles from '@style'

export default function LoadingDaoMessage({ message }) {
  return (
    <div className={styles.loading_containter}>
      <Loading message={message ?? 'Loading DAO information'} />
    </div>
  )
}
