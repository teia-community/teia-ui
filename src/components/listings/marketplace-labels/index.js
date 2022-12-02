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

export const MarketplaceLabel = ({ listing }) => {
  if (listing.contract_address === MARKETPLACE_CONTRACT_TEIA) {
    return <TeiaLabel />
  }
  /*
  TODO: re-add this code
  if (
    (listing.contract_address === MARKETPLACE_CONTRACT_V1 ||
      listing.contract_address === MARKETPLACE_CONTRACT_V2) &&
      listing.token.creator_id.startsWith('KT1')
  ) {
    return <CollabLabel />
  }
  */
  if (
    listing.contract_address === MARKETPLACE_CONTRACT_V1 ||
    listing.contract_address === MARKETPLACE_CONTRACT_V2
  ) {
    return <HENLabel />
  }
  if (
    listing.contract_address === MARKETPLACE_CONTRACT_OBJKTCOM_V1 ||
    listing.contract_address === MARKETPLACE_CONTRACT_OBJKTCOM_V4 ||
    listing.type.startsWith('OBJKT')
  ) {
    return <OBJKTLabel />
  }

  // TODO: add Versum label here

  console.error('Could not resolve the proper label for this listing', listing)
  return null
}
