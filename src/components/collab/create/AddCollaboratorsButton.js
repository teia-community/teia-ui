import { Button, Purchase } from '@atoms/button'
import { validAddress } from '../functions'
import styles from '../index.module.scss'

export const AddCollaboratorsButton = ({
  collaborators,
  onClick,
  threshold = 2,
}) => {
  const validCollaborators = collaborators.filter(
    (c) => !!c.shares && validAddress(c.address)
  )

  return (
    <div className={styles.mt3}>
      <Button
        onClick={onClick}
        disabled={validCollaborators.length < threshold}
        className={styles.btnSecondary}
      >
        <Purchase>{validCollaborators.length === 0 ? 'Skip' : 'Next'}</Purchase>
      </Button>
    </div>
  )
}
