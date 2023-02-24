import styles from '@style'
import { memo } from 'react'

const ListingLabel = ({ children, className, label, alt, tooltip }) => {
  return (
    <div
      className={`${styles.swapLabel} ${className ? className : ''}`}
      title={tooltip ? tooltip : alt}
      aria-label={alt}
    >
      {label}
    </div>
  )
}

export const TeiaLabel = () => (
  <ListingLabel
    label="TEIA"
    className={styles.teiaLabel}
    alt="buy this listing and support teia"
  />
)

export const HENLabel = () => (
  <ListingLabel
    label="H=N"
    alt="this listing is through the original HEN contract"
  />
)
export const OBJKTLabel = () => (
  <ListingLabel label="Objkt.com" alt="This swap is through OBJKT.com" />
)

export const RestrictedLabel = () => (
  <ListingLabel
    label="Restricted"
    alt="This swap is made by a restricted wallet."
  />
)

export const VersumLabel = () => (
  <ListingLabel label="Versum.xyz" alt="This swap is through versum.xyz" />
)

/**
 * Dynamic label from listing type.
 * @param {{listing:import('@types').Listing}} options
 * @returns {JSX.Element | null}
 */
const MarketplaceLabel = ({ listing }) => {
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
