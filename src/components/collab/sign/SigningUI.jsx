import { useContext } from 'react'
import { TeiaContext } from '../../../context/TeiaContext'
import { Button } from '@atoms/button'
import styles from '../index.module.scss'

export const SigningUI = ({ id, hasSigned }) => {
  const context = useContext(TeiaContext)

  const sign = () => {
    context.sign(id).then((response) => console.log(response))
  }

  return hasSigned ? (
    <p>You have signed this work</p>
  ) : (
    <div className={styles.border}>
      <div className={styles.flexBetween}>
        <p>
          You are a core participant in this work but you haven’t signed it yet
        </p>
        <Button shadow_box onClick={() => sign()}>
          sign work now
        </Button>
      </div>
    </div>
  )
}

export default SigningUI
