import { useState } from 'react'
import { PATH } from '@constants'
import { walletPreview } from '@utils/string'
import styles from '../index.module.scss'
import ParticipantList from '../manage/ParticipantList'
import { CollaboratorType } from '@constants'
import { Button } from '@atoms/button'
import type { Maybe, Teia_Users } from 'gql'

export const CollabIssuerInfo = ({
  creator,
}: {
  creator?: Maybe<Teia_Users> | undefined
}) => {
  // const { name, user_address } = creator
  const [showCollabSummary, setShowCollabSummary] = useState(false)

  const coreParticipants = (creator?.split_contract?.shareholders || []).filter(
    (h) => h.holder_type === CollaboratorType.CORE_PARTICIPANT
  )
  const path = creator?.name
    ? `/collab/${creator.name}`
    : `${PATH.COLLAB}/${creator?.user_address}`

  return (
    <div
      onMouseOver={() => setShowCollabSummary(true)}
      onFocus={() => setShowCollabSummary(true)}
      onMouseOut={() => setShowCollabSummary(false)}
      onBlur={() => setShowCollabSummary(false)}
    >
      <Button className={styles.issuerBtn} to={path}>
        {creator?.name === ''
          ? walletPreview(creator?.user_address)
          : creator?.name}
      </Button>

      {showCollabSummary && (
        <div className={styles.collabInfo}>
          <ParticipantList participants={coreParticipants} />
        </div>
      )}
    </div>
  )
}

export default CollabIssuerInfo
