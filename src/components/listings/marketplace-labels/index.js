import styles from './styles.module.scss'
import {
  MARKETPLACE_CONTRACT_TEIA,
  MARKETPLACE_CONTRACT_V1,
  MARKETPLACE_CONTRACT_V2,
  MARKETPLACE_CONTRACT_OBJKTCOM_V1,
  MARKETPLACE_CONTRACT_OBJKTCOM_V4,
} from '@constants'

export const TeiaLabel = () => (
  <span
    className={`${styles.swapLabel} ${styles.teiaLabel}`}
    title="buy this listing and support teia"
  >
    TEIA
  </span>
)
export const HENLabel = () => (
  <span
    className={styles.swapLabel}
    title="this listing is through the original HEN contract"
  >
    H=N
  </span>
)
export const CollabLabel = () => (
  <span
    className={styles.swapLabel}
    title="this listing is a collab through the original HEN contract"
  >
    Collab
  </span>
)
export const OBJKTLabel = () => (
  <span className={styles.swapLabel} title="This swap is through OBJKT.com">
    Objkt.com
  </span>
)
export const RestrictedLabel = () => (
  <span
    className={styles.swapLabel}
    title="This swap is made by a restricted wallet."
  >
    Restricted
  </span>
)

export const MarketplaceLabel = ({ swap }) => {
  if (swap.contract_address === MARKETPLACE_CONTRACT_TEIA) {
    return <TeiaLabel />
  }
  if (
    (swap.contract_address === MARKETPLACE_CONTRACT_V1 ||
      swap.contract_address === MARKETPLACE_CONTRACT_V2) &&
    swap.token.creator_id.startsWith('KT1')
  ) {
    return <CollabLabel />
  }
  if (
    swap.contract_address === MARKETPLACE_CONTRACT_V1 ||
    swap.contract_address === MARKETPLACE_CONTRACT_V2
  ) {
    return <HENLabel />
  }
  if (
    swap.contract_address === MARKETPLACE_CONTRACT_OBJKTCOM_V1 ||
    swap.contract_address === MARKETPLACE_CONTRACT_OBJKTCOM_V4 ||
    swap.type === 'objktcom_ask'
  ) {
    return <OBJKTLabel />
  }

  console.error('Could not resolve the proper label for this swap', swap)
  return null
}
