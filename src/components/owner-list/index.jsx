import React from 'react'
import get from 'lodash/get'
import { Button } from '@atoms/button'
import { MARKETPLACE_CONTRACT_V1, BURN_ADDRESS } from '@constants'
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
              {encodeURI(get(holder_profile, 'name'))}
            </Button>
          ) : holder_address === MARKETPLACE_CONTRACT_V1 ? (
            <Button to={`/tz/${holder_address}`}>OBJKTSWAP V1</Button>
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
