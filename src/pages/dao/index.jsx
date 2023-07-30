import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import styles from '@style'

export const DAO = () => {

  const claimTokens = useUserStore((st) => st.claimTokens)

  return (
    <Page title="Claim DAO tokens" large>
      <div className={styles.dao__outer__container}>
        <h1 className={styles.dao__title}>How to claim your Teia DAO tokens</h1>
      </div>

      <div className={styles.dao__outer__container}>
        <p>Warning, warning, warning!</p>
      </div>

      <div className={styles.dao__outer__container}>
        <Line />
      </div>

      <div className={styles.dao__outer__container}>
        <Button shadow_box onClick={claimTokens}>Claim DAO tokens</Button>
      </div>
    </Page>
  )
}
