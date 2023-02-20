import { useState } from 'react'
import get from 'lodash/get'
import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import styles from '../index.module.scss'
import ParticipantList from '../manage/ParticipantList'
import { CollaboratorType } from '@constants'
import { Button } from '@atoms/button'
import { ArtistProfile } from '@types'

export const CollabIssuerInfo = ({ creator }: { creator: ArtistProfile }) => {
  const { name, user_address } = creator
  const [showCollabSummary, setShowCollabSummary] = useState(false)

  const coreParticipants = get(
    creator,
    'split_contract.shareholders',
    []
  ).filter((h) => h.holder_type === CollaboratorType.CORE_PARTICIPANT)
  const path = name ? `/collab/${name}` : `${PATH.COLLAB}/${user_address}`

  return (
    <div
      onMouseOver={() => setShowCollabSummary(true)}
      onFocus={() => setShowCollabSummary(true)}
      onMouseOut={() => setShowCollabSummary(false)}
      onBlur={() => setShowCollabSummary(false)}
    >
      <Button className={styles.issuerBtn} to={path}>
        {name === '' ? walletPreview(user_address) : name}
      </Button>

      {showCollabSummary && (
        <div className={styles.collabInfo}>
          <ParticipantList title={false} participants={coreParticipants} />
        </div>
      )}
    </div>
  )
}

export default CollabIssuerInfo
