import { Button, Primary } from '@atoms/button'
import styles from '@style'
import { memo } from 'react'

const ErrorComponent = ({ title = 'Ooops!', message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.msg_box}>
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
      <Button href="https://github.com/teia-community/teia-ui/issues">
        <Primary>
          <strong>Report Issue</strong>
        </Primary>
      </Button>
      <Button to="/">
        <Primary>Go back home</Primary>
      </Button>
    </div>
  )
}

export default memo(ErrorComponent)
