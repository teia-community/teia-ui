import get from 'lodash/get'
import React, { useContext, useState } from 'react'
import { Button, Primary, Purchase } from '@atoms/button'

import { walletPreview } from '@utils/string'
import styles from '@style'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { MarketplaceLabel, RestrictedLabel } from '@atoms/marketplace-labels'
import useSettings from 'hooks/use-settings'

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
  acc,
  proxyAdminAddress,
  rowId,
}) {
  const { walletBlockMap } = useSettings()

  const isOwnSwap =
    listing.seller_address === acc?.address ||
    (proxyAdminAddress === acc?.address &&
      listing.seller_address === proxyAddress)

  console.log('isOwnSwap', isOwnSwap)

  return (
    <div className={styles.swap}>
      <div className={styles.issuer}>
        {listing.amount_left} ed.&nbsp;
        <Button to={`/tz/${listing.seller_address}`}>
          <Primary>
            {get(listing, 'seller_profile.name') ||
              walletPreview(listing.seller_address)}
          </Primary>
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
            <Button onClick={() => onCollectClick(listing)}>
              <Purchase>
                Collect for {parseFloat(listing.price / 1000000)} tez
              </Purchase>
            </Button>
          )}
        {isOwnSwap &&
          (listing.type.startsWith('TEIA') ||
            listing.type.startsWith('HEN')) && (
            <>
              <div className={styles.break}></div>
              <input
                value={
                  reswapPrices[rowId] || parseFloat(listing.price / 1000000)
                }
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
                onClick={() => {
                  const priceTz = reswapPrices[rowId]

                  if (!priceTz || priceTz <= 0) {
                    // TODO: communicate the error to the user.
                    return
                  }

                  // TODO: add a indicator (spinner or something) that shows that the reswap is in progress
                  // TODO: test reswap after teztok integration
                  reswap(priceTz * 1000000, listing)
                  // TODO: after the reswap was successful we should send some feedback to the user
                }}
              >
                <Purchase className={styles.smol}>reswap</Purchase>
              </Button>

              <Button
                onClick={() =>
                  cancel(listing.contract_address, listing.swap_id)
                }
                className={styles.smol}
              >
                <Purchase>cancel</Purchase>
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
  handleCollect,
  handleCollectObjktcomAsk,
  cancel,
  proxyAdminAddress,
  restricted,
  reswap,
}) => {
  const { acc, proxyAddress } = useContext(HicetnuncContext)
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
            acc={acc}
            proxyAdminAddress={proxyAdminAddress}
            proxyAddress={proxyAddress}
            reswapPrices={reswapPrices}
            setReswapPrices={setReswapPrices}
            reswap={reswap}
            cancel={cancel}
            onCollectClick={() => {
              console.log('buy', listing)
              handleCollect(listing)
            }}
          />
        )
      })}
      <hr className={styles.nomobile}></hr>
    </div>
  )
}
