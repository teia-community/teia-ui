//import { useEffect, useState } from 'react'
import get from 'lodash/get'
import { PATH } from '../../../constants'
import { Link } from 'react-router-dom'
//import { GetUserMetadata } from '../../../data/api'
import styles from '../styles.module.scss'

export const CollabParticipant = ({ participant }) => {
  const displayName = get(participant, 'shareholder_profile.name')
    ? get(participant, 'shareholder_profile.name')
    : participant.shareholder_address
  /*
  // TODO: re-add this logic? it's quite a heavy operation

  const [displayName, setDisplayName] = useState(name)
  useEffect(() => {
    if (!displayName) {
      GetUserMetadata(address).then(({ data }) =>
        setDisplayName(data.alias || address)
      )
    }
  }, [collabData.address, displayName]) // eslint-disable-line react-hooks/exhaustive-deps
  */

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
