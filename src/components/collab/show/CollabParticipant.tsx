import { PATH } from '@constants'
import { Link } from 'react-router-dom'
import styles from '../index.module.scss'
import type { Teia_Shareholders } from 'gql'

export const CollabParticipant = ({
  participant,
}: {
  participant: Teia_Shareholders
}) => {
  const displayName = participant.shareholder_profile?.name
    ? participant.shareholder_profile.name
    : participant.shareholder_address

  return (
    displayName && (
      <Link
        className={styles.link}
        to={`${PATH.ISSUER}/${participant.shareholder_address}`}
      >
        {displayName}
      </Link>
    )
  )
}
