import useSettings from '@hooks/use-settings'
import { sum } from 'lodash'
import { memo, useMemo } from 'react'

/**
 * @param {Object} editionOptions
 * @param {import("@types").NFT} editionOptions.nft
 **/
const Editions = ({ prefix, nft, className }) => {
  const { walletBlockMap, isLoading } = useSettings()

  const editionsForSale = useMemo(() => {
    if (isLoading) return
    return sum(
      nft.listings
        ?.filter((listing) => walletBlockMap.get(listing.seller_address) !== 1)
        .map(({ amount_left }) => amount_left)
    )
  }, [isLoading, nft.listings, walletBlockMap])
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

export default memo(Editions)
