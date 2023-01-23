import get from 'lodash/get'
import { PATH } from '@constants'
import { Link } from 'react-router-dom'
import styles from '../index.module.scss'

export const CollabParticipant = ({ participant }) => {
  const displayName = get(participant, 'shareholder_profile.name')
    ? get(participant, 'shareholder_profile.name')
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
