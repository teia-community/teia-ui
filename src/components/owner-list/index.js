import React from 'react'
import get from 'lodash/get'
import { Button, Primary } from '../button'
import { MARKETPLACE_CONTRACT_V1, BURN_ADDRESS } from '../../constants'
import { walletPreview } from '../../utils/string'
import styles from './styles.module.scss'

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
              <Primary>{encodeURI(get(holder_profile, 'name'))}</Primary>
            </Button>
          ) : holder_address !== MARKETPLACE_CONTRACT_V1 ? (
            <Button to={`/tz/${holder_address}`}>
              <Primary>{walletPreview(holder_address)}</Primary>
            </Button>
          ) : (
            <Button to={`/tz/${holder_address}`}>
              <Primary>OBJKTSWAP V1</Primary>
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
