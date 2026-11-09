import styles from './QuorumMeter.module.scss'
import { quorumProgress } from '@utils/multisig-proposals.mjs'

/** How close a proposal is to the votes it needs. */
export default function QuorumMeter({ inFavour, quorum }) {
  const share = quorumProgress(inFavour, quorum)
  return (
    <div
      className={styles.quorum}
      role="img"
      aria-label={`${inFavour} of ${quorum} votes needed`}
    >
      <div className={styles.quorum_track}>
        <div
          className={styles.quorum_fill}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <span className={styles.quorum_label}>
        {inFavour}/{quorum} in favour
      </span>
    </div>
  )
}
