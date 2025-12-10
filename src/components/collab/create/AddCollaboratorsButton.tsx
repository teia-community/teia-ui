import { Button } from '@atoms/button'
import { memo } from 'react'
import { validAddress } from '@utils/collab'
import styles from '../index.module.scss'

const AddCollaboratorsButton = ({ collaborators, onClick, threshold = 2 }) => {
  const validCollaborators = collaborators.filter(
    (c) => !!c.shares && validAddress(c.address)
  )

  return (
    <div className={styles.mt3}>
      <Button
        onClick={onClick}
        disabled={validCollaborators.length < threshold}
        className={styles.btnSecondary}
        shadow_box
      >
        {validCollaborators.length === 0 ? 'Skip' : 'Next'}
      </Button>
    </div>
  )
}

export default memo(AddCollaboratorsButton)
