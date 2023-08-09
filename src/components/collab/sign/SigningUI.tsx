import { Button } from '@atoms/button'
import styles from '../index.module.scss'
import { useCollabStore } from '@context/collabStore'

export const SigningUI = ({
  id,
  hasSigned,
}: {
  id: string
  hasSigned: boolean
}) => {
  const sign = useCollabStore((st) => st.sign)

  const do_sign = () => {
    sign(id).then((r) => console.debug('Signed', r))
  }

  return hasSigned ? (
    <p>You have signed this work</p>
  ) : (
    <div className={styles.border}>
      <div className={styles.flexBetween}>
        <p>
          You are a core participant in this work but you haven’t signed it yet
        </p>
        <Button shadow_box onClick={do_sign}>
          sign work now
        </Button>
      </div>
    </div>
  )
}

export default SigningUI
