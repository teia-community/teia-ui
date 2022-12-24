import { Button, Primary } from '@atoms/button'
import styles from '@style'

export function HTMLWarning() {
  return (
    <div className={styles.warning}>
      <p>IMPORTANT: Please read the guide before minting!</p>
      <Button href="https://github.com/teia-community/teia-docs/wiki/Interactive-OBJKTs">
        <Primary>
          <strong>Interactive OBJKTs Guide</strong>
        </Primary>
      </Button>
    </div>
  )
}
