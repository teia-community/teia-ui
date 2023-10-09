import { Loading } from '@atoms/loading'
import styles from '@style'

export default function LoadingDaoMessage() {
  return (
    <div className={styles.loading_containter}>
      <Loading message="Loading DAO information" />
    </div>
  )
}
