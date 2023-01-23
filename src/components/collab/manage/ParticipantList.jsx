import { CollabParticipant } from '../show/CollabParticipant'
import styles from '../index.module.scss'
import { memo } from 'react'

const ParticipantList = ({ title, participants }) => {
  return (
    <div>
      <div className={styles.flex}>
        {title && (
          <p className={styles.infoLabel}>
            <span>{title}:</span>
          </p>
        )}
        <div>
          {participants.map((participant, index) => [
            index > 0 && index < participants.length - 1 && ', ',
            index > 0 && index === participants.length - 1 && ', ',
            <CollabParticipant
              key={participant.shareholder_address}
              participant={participant}
            />,
          ])}
        </div>
      </div>
    </div>
  )
}

export default memo(ParticipantList)
