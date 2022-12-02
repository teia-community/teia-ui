import { CollabParticipant } from '../show/CollabParticipant'
import styles from '../styles.module.scss'

export const ParticipantList = ({ title, participants }) => {
  return (
    <div>
      <div className={styles.flex}>
        {title && (
          <h3 className={styles.infoLabel}>
            <span>{title}:</span>
          </h3>
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
