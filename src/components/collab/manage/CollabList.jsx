import { useState } from 'react'
import { Button } from '@atoms/button'
import { CollabParticipantInfo } from './CollabParticipantInfo'
import styles from '@components/collab/index.module.scss'
import classNames from 'classnames'

export const CollabList = ({ description, collabs }) => {
  const [showDetail, setShowDetail] = useState(false)

  const headerStyle = classNames(styles.flex, styles.flexBetween)
  const componentStyle = classNames(styles.borderBottom, styles.mb3)

  return (
    <div className={componentStyle}>
      <div className={headerStyle}>
        {description && <p className={styles.mb1}>{description}</p>}

        <div className={styles.mb2}>
          <Button shadow_box onClick={() => setShowDetail(!showDetail)}>
            {showDetail ? 'less detail' : 'more detail'}
          </Button>
        </div>
      </div>

      <ul>
        {collabs.map((collab) => (
          <CollabParticipantInfo
            key={collab.contract_address}
            collabData={collab}
            expanded={showDetail}
          />
        ))}
      </ul>
    </div>
  )
}
