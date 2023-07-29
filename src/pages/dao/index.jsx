import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import styles from '@style'
import {claimTokens} from './utils'

export const DAO = () => {

  return (
    <Page title="DAO" large>
      <div className={styles.dao__outer__container}>
        <h1 className={styles.dao__title}>TEIA DAO</h1>
      </div>

      <div className={styles.dao__outer__container}>
        <p>Warning, warning, warning!</p>
      </div>

      <div className={styles.dao__outer__container}>
        <Line />
      </div>

      <div className={styles.dao__outer__container}>
        <Button onClick={claimTokens}>claim DAO tokens</Button>
      </div>
    </Page>
  )
}
