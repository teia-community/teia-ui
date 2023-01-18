import useSettings from '@hooks/use-settings'
import { sum } from 'lodash'

/**
 * @param {Object} editionOptions
 * @param {import("@types").NFT} editionOptions.nft
 **/
const Editions = ({ prefix, nft, className }) => {
  const { walletBlockMap } = useSettings()
  const editionsForSale = sum(
    nft.listings
      ?.filter((listing) => walletBlockMap.get(listing.seller_address) !== 1)
      .map(({ amount_left }) => amount_left)
  )
  const ed = editionsForSale || 'X'
  return (
    <div className={className}>
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

export default Editions
