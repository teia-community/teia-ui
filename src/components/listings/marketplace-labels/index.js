import styles from './styles.module.scss'
import {
  MARKETPLACE_CONTRACT_TEIA,
  MARKETPLACE_CONTRACT_V1,
  MARKETPLACE_CONTRACT_V2,
  MARKETPLACE_CONTRACT_OBJKTCOM_V1,
  MARKETPLACE_CONTRACT_OBJKTCOM_V4,
} from '@constants'

export const TeiaLabel = () => (
  <span className={styles.swapLabel} title="buy this listing and support teia">
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
export const OBJKTLabel = () => (
  <span className={styles.swapLabel} title="This swap is through OBJKT.com">
    Objkt.com
  </span>
)

export const MarketplaceLabel = ({ swap }) => {
  if (swap.contract_address === MARKETPLACE_CONTRACT_TEIA) {
    return <TeiaLabel />
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
