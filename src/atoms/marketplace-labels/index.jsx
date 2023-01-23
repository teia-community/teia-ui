import styles from '@style'
import { memo } from 'react'

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

export const VersumLabel = () => (
  <span className={styles.swapLabel} title="This swap is through versum.xyz">
    Versum.xyz
  </span>
)

const MarketplaceLabel = ({ listing, nft }) => {
  if (listing.type.startsWith('TEIA')) {
    return <TeiaLabel />
  }

  if (listing.type.startsWith('HEN')) {
    return <HENLabel />
  }

  if (listing.type.startsWith('OBJKT')) {
    return <OBJKTLabel />
  }

  if (listing.type.startsWith('VERSUM')) {
    return <VersumLabel />
  }

  console.error('Could not resolve the proper label for this listing', listing)
  return null
}

export default memo(MarketplaceLabel)
