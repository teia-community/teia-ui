import { Button } from '@atoms/button'
import styles from '@style'
import { memo } from 'react'

const ErrorComponent = ({ title = 'Ooops!', message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.msg_box}>
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
      <Button primary href="https://github.com/teia-community/teia-ui/issues">
        <strong>Report Issue</strong>
      </Button>
      <Button primary to="/">
        Go back home
      </Button>
    </div>
  )
}

export default memo(ErrorComponent)
