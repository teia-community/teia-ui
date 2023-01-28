import styles from '@style'
import { memo } from 'react'

export const TeiaLabel = () => (
  <div
    className={`${styles.swapLabel} ${styles.teiaLabel}`}
    title="buy this listing and support teia"
  >
    TEIA
  </div>
)
export const HENLabel = () => (
  <div
    className={styles.swapLabel}
    title="this listing is through the original HEN contract"
  >
    H=N
  </div>
)

export const OBJKTLabel = () => (
  <div className={styles.swapLabel} title="This swap is through OBJKT.com">
    Objkt.com
  </div>
)

export const RestrictedLabel = () => (
  <div
    className={styles.swapLabel}
    title="This swap is made by a restricted wallet."
  >
    Restricted
  </div>
)

export const VersumLabel = () => (
  <div className={styles.swapLabel} title="This swap is through versum.xyz">
    Versum.xyz
  </div>
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
