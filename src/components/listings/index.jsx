import get from 'lodash/get'
import { useState } from 'react'
import { Button } from '@atoms/button'

import { walletPreview } from '@utils/string'
import styles from '@style'
import MarketplaceLabel, { RestrictedLabel } from '@atoms/marketplace-labels'
import useSettings from '@hooks/use-settings'
import { Line } from '@atoms/line'

// TODO: add support for all kind of listings
function ListingRow({
  listing,
  restricted,
  proxyAddress,
  onCollectClick,
  reswapPrices,
  setReswapPrices,
  reswap,
  cancel,
  address,
  proxyAdminAddress,
  rowId,
}) {
  const { walletBlockMap } = useSettings()

  const isOwnSwap =
    listing.seller_address === address ||
    (proxyAdminAddress === address && listing.seller_address === proxyAddress)

  console.debug('isOwnSwap', isOwnSwap)

  return (
    <div className={styles.swap}>
      <div className={styles.issuer}>
        {listing.amount_left} ed.&nbsp;
        <Button to={`/tz/${listing.seller_address}`}>
          {get(listing, 'seller_profile.name') ||
            walletPreview(listing.seller_address)}
        </Button>
      </div>

      <div className={styles.buttons}>
        {(restricted || walletBlockMap.get(listing.seller_address) === 1) && (
          <RestrictedLabel />
        )}
        <MarketplaceLabel listing={listing} />
        {!restricted &&
          walletBlockMap.get(listing.seller_address) !== 1 &&
          !isOwnSwap && (
            <Button shadow_box onClick={() => onCollectClick(listing)}>
              {`Collect for ${parseFloat(listing.price / 1e6)} tez`}
            </Button>
          )}
        {isOwnSwap &&
          (listing.type.startsWith('TEIA') ||
            listing.type.startsWith('HEN')) && (
            <>
              <div className={styles.break} />
              <input
                value={reswapPrices[rowId] || parseFloat(listing.price / 1e6)}
                onChange={(ev) => {
                  const { value } = ev.target
                  setReswapPrices((prevVal) => ({
                    ...prevVal,
                    [rowId]: value,
                  }))
                }}
                type="number"
                placeholder="New price"
                style={{ width: '80px', marginRight: '5px' }}
              />
              <Button
                className={styles.smol}
                shadow_box
                onClick={() => {
                  const priceTz = reswapPrices[rowId]

                  if (!priceTz || priceTz <= 0) {
                    // TODO: communicate the error to the user.
                    return
                  }

                  // TODO: add a indicator (spinner or something) that shows that the reswap is in progress
                  // TODO: test reswap after teztok integration
                  reswap(priceTz * 1e6, listing)
                  // TODO: after the reswap was successful we should send some feedback to the user
                }}
              >
                reswap
              </Button>

              <Button
                shadow_box
                onClick={() =>
                  cancel(listing.contract_address, listing.swap_id)
                }
                className={styles.smol}
              >
                cancel
              </Button>
            </>
          )}
      </div>
    </div>
  )
}

export const Listings = ({
  id,
  listings,
  address,
  proxyAddress,
  handleCollect,
  handleCollectObjktcomAsk,
  cancel,
  proxyAdminAddress,
  restricted,
  reswap,
}) => {
  const [reswapPrices, setReswapPrices] = useState({})
  const listingsWithKeys = listings.map((listing) => ({
    ...listing,
    key: listing.swap_id || listing.ask_id || listing.offer_id,
  }))

  return (
    <div className={styles.container}>
      {listingsWithKeys.map((listing) => {
        return (
          <ListingRow
            key={listing.key}
            rowId={listing.key}
            listing={listing}
            restricted={restricted}
            address={address}
            proxyAdminAddress={proxyAdminAddress}
            proxyAddress={proxyAddress}
            reswapPrices={reswapPrices}
            setReswapPrices={setReswapPrices}
            reswap={reswap}
            cancel={cancel}
            onCollectClick={() => {
              console.debug('buy', listing)
              handleCollect(listing)
            }}
          />
        )
      })}
      <Line />
    </div>
  )
}
