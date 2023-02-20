import get from 'lodash/get'
import { walletPreview } from '@utils/string'
import styles from '../index.module.scss'
import { Shareholder, Signature } from '@types'

export const SigningSummary = ({
  coreParticipants,
  signatures,
}: {
  coreParticipants: Shareholder[]
  signatures: Signature[]
}) => {
  return (
    <div>
      <h2 className={styles.mb1}>
        <strong>Signing status</strong>
      </h2>
      <ul className={styles.list}>
        {coreParticipants.map((participant) => {
          const hasSigned = signatures.some(
            ({ shareholder_address }) =>
              participant.shareholder_address === shareholder_address
          )

          return (
            <li key={participant.shareholder_address}>
              <a href={`/tz/${participant.shareholder_address}`}>
                {get(participant, 'shareholder_profile.name') ||
                  walletPreview(participant.shareholder_address)}
                :{' '}
              </a>
              {hasSigned ? '✓' : '❌'}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SigningSummary
