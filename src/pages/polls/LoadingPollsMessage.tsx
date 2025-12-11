import { Loading } from '@atoms/loading'
import styles from '@style'

export default function LoadingPollsMessage({ message }: { message?: string }) {
  return (
    <div className={styles.loading_containter}>
      <Loading message={message ?? 'Loading polls information'} />
    </div>
  )
}
