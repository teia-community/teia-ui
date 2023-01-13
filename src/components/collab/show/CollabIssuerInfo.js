import { useState } from 'react'
import get from 'lodash/get'
import { PATH } from '../../../constants'
import { walletPreview } from '../../../utils/string'
import { Primary } from '@atoms/button'
import styles from '../index.module.scss'
import { ParticipantList } from '../../collab/manage/ParticipantList'
import { CollaboratorType } from '../constants'

export const CollabIssuerInfo = ({ creator }) => {
  const { name, user_address } = creator
  const [showCollabSummary, setShowCollabSummary] = useState(false)

  const coreParticipants = get(creator, 'split_contract.shareholders').filter(
    (h) => h.holder_type === CollaboratorType.CORE_PARTICIPANT
  )
  const path = name ? `/collab/${name}` : `${PATH.COLLAB}/${user_address}`

  return (
    <div>
      <a
        className={styles.issuerBtn}
        href={path}
        onMouseOver={() => setShowCollabSummary(true)}
        onFocus={() => setShowCollabSummary(true)}
        onMouseOut={() => setShowCollabSummary(false)}
        onBlur={() => setShowCollabSummary(false)}
      >
        <Primary>{name !== '' ? name : walletPreview(user_address)}</Primary>
      </a>

      {showCollabSummary && (
        <div className={styles.collabInfo}>
          <ParticipantList title={false} participants={coreParticipants} />
        </div>
      )}
    </div>
  )
}

export default CollabIssuerInfo
