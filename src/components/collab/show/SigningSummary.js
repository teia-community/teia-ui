import { walletPreview } from '../../../utils/string'
import styles from '../styles.module.scss'

export const SigningSummary = ({ coreParticipants, signatures }) => {
  return (
    <div>
      <h2 className={styles.mb1}>
        <strong>Signing status</strong>
      </h2>
      <ul className={styles.list}>
        {coreParticipants.map(({ holder }) => {
          const hasSigned = signatures.some(
            ({ holder_id }) => holder.address === holder_id
          )

          return (
            <li>
              <a href={`/tz/${holder.address}`}>
                {holder.name || walletPreview(holder.address)}:{' '}
              </a>
              {hasSigned ? '✓' : '❌'}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
