import { Loading } from '@atoms/loading'
import styles from '@style'

export default function LoadingPollsMessage({ message }) {
  return (
    <div className={styles.loading_containter}>
      <Loading message={message ?? 'Loading polls information'} />
    </div>
  )
}
