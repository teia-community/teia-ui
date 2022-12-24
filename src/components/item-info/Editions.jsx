import useSettings from '@hooks/use-settings'
import { sum } from 'lodash'

/**
 * @param {Object} editionOptions
 * @param {import("@types").NFT} editionOptions.nft
 **/
export const Editions = ({ prefix, nft }) => {
  const { walletBlockMap } = useSettings()
  const editionsForSale = sum(
    nft.listings
      ?.filter((listing) => walletBlockMap.get(listing.seller_address) !== 1)
      .map(({ amount_left }) => amount_left)
  )
  const ed = editionsForSale || 'X'
  return (
    <div>
      <p>
        {prefix ? (
          <span>
            Editions:
            <span>
              {ed}/{nft.editions}
            </span>
          </span>
        ) : (
          <span>
            {ed}/{nft.editions}
          </span>
        )}
      </p>
    </div>
  )
}
