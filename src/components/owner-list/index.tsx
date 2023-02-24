import get from 'lodash/get'
import { Button } from '@atoms/button'
import { BURN_ADDRESS, MARKETPLACE_CONTRACTS_TO_NAME } from '@constants'
import { walletPreview } from '@utils/string'
import styles from '@style'

export const OwnerList = ({ owners }) => {
  const ownersWithoutBurn = owners.filter(
    (e) => e.holder_address !== BURN_ADDRESS
  )

  return (
    <div className={styles.container}>
      {ownersWithoutBurn.map(({ amount, holder_address, holder_profile }) => (
        <div key={holder_address} className={styles.owner}>
          {amount}&nbsp;ed.&nbsp;
          {get(holder_profile, 'name') ? (
            <Button to={`/${get(holder_profile, 'name')}`}>
              {get(holder_profile, 'name')}
            </Button>
          ) : MARKETPLACE_CONTRACTS_TO_NAME[holder_address] ? (
            <Button to={`/tz/${holder_address}`}>
              {MARKETPLACE_CONTRACTS_TO_NAME[holder_address]}
            </Button>
          ) : (
            <Button to={`/tz/${holder_address}`}>
              {walletPreview(holder_address)}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
