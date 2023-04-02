import get from 'lodash/get'
import React, { useMemo, useState } from 'react'
import { Button } from '@atoms/button'

import { walletPreview } from '@utils/string'
import styles from '@style'
import MarketplaceLabel, { RestrictedLabel } from '@atoms/marketplace-labels'
import useSettings from '@hooks/use-settings'
import { Line } from '@atoms/line'
import { Listing, NFT } from '@types'
import { useUserStore } from '@context/userStore'

// TODO: add support for all kind of listings
function ListingRow({
  nft,
  listing,
  onCollectClick,
  reswapPrices,
  setReswapPrices,
  proxyAdminAddress,
  rowId,
}: {
  nft: NFT
  listing: Listing
  proxyAddress: string
  onCollectClick: (listing: Listing) => void
  reswapPrices: { [key: string]: number }
  setReswapPrices: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >
  reswap: (nft: NFT, price: number, listing: Listing) => void
  cancel: (contract: string, swap_id: string) => void
  address: string
  proxyAdminAddress: string
  rowId: string
}) {
  const { walletBlockMap } = useSettings()
  const [address, proxyAddress] = useUserStore((st) => [
    st.address,
    st.proxyAddress,
  ])

  const reswap = useUserStore((st) => st.reswap)
  const cancel = useUserStore((st) => st.cancel)
  const isOwnSwap =
    listing.seller_address === address ||
    (proxyAdminAddress === address && listing.seller_address === proxyAddress)

  console.debug('isOwnSwap', isOwnSwap)
  const restricted = useMemo(() => {
    return nft.restricted || walletBlockMap.get(listing.seller_address) === 1
  }, [nft.restricted, walletBlockMap, listing.seller_address])

  return (
    <div className={styles.swap}>
      <div className={styles.issuer}>
        {listing.amount_left} ed.&nbsp;
        <Button alt="seller" to={`/tz/${listing.seller_address}`}>
          {get(listing, 'seller_profile.name') ||
            walletPreview(listing.seller_address)}
        </Button>
      </div>

      <div className={styles.buttons}>
        {restricted && <RestrictedLabel />}
        <MarketplaceLabel listing={listing} />
        {!restricted &&
          walletBlockMap.get(listing.seller_address) !== 1 &&
          !isOwnSwap && (
            <Button
              alt={'collect'}
              shadow_box
              onClick={() => onCollectClick(listing)}
            >
              {`Collect for ${listing.price / 1e6} tez`}
            </Button>
          )}

        {isOwnSwap &&
          !restricted &&
          (listing.type.startsWith('TEIA') ||
            listing.type.startsWith('HEN')) && (
            <>
              <div className={styles.break} />
              <input
                value={reswapPrices[rowId] || listing.price / 1e6}
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
                alt={'Click to reswap'}
                className={styles.smol}
                shadow_box
                onClick={async () => {
                  const priceTz = reswapPrices[rowId]

                  if (!priceTz || priceTz <= 0) {
                    // TODO: communicate the error to the user.
                    return
                  }

                  // TODO: add a indicator (spinner or something) that shows that the reswap is in progress
                  // TODO: test reswap after teztok integration

                  await reswap(nft, priceTz * 1e6, listing)

                  // TODO: after the reswap was successful we should send some feedback to the user
                }}
              >
                reswap
              </Button>
            </>
          )}
        {isOwnSwap && (
          <Button
            alt={'Click to cancel swap'}
            shadow_box
            onClick={() => cancel(listing.contract_address, listing.swap_id)}
            className={styles.smol}
          >
            cancel
          </Button>
        )}
      </div>
    </div>
  )
}

export const Listings = ({
  // id,
  // listings,
  proxyAdminAddress,
  nft,
  // address,
  // proxyAddress,
  handleCollect,
}: // handleCollectObjktcomAsk,
// cancel,
// restricted,
// reswap,
{
  proxyAdminAddress: string
  nft: NFT
  handleCollect: (listing: Listing) => void
}) => {
  const [reswapPrices, setReswapPrices] = useState({})
  const listingsWithKeys = nft.listings?.map((listing) => ({
    ...listing,
    key: listing.swap_id || listing.ask_id || listing.offer_id,
  }))

  return (
    <div className={styles.container}>
      {listingsWithKeys.map((listing) => {
        return (
          <ListingRow
            nft={nft}
            key={listing.key}
            rowId={listing.key!}
            listing={listing}
            // restricted={nft.restricted}
            // address={address}
            proxyAdminAddress={proxyAdminAddress}
            // proxyAddress={proxyAddress}
            reswapPrices={reswapPrices}
            setReswapPrices={setReswapPrices}
            // reswap={reswap}
            // cancel={cancel}
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
