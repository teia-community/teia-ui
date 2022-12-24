import { Button, Primary } from '@atoms/button'
import styles from '@style'

export const ErrorComponent = ({ title = 'Ooops!', message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.msg_box}>
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
      <Button to="/">
        <Primary>Go back home</Primary>
      </Button>
    </div>
  )
}
