import get from 'lodash/get'
import { Container } from '@atoms/layout'
import { OwnerList } from '@components/owner-list'
import { Listings } from '@components/listings'
import { useOutletContext } from 'react-router'
import { useUserStore } from '@context/userStore'

export const Collectors = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft } = useOutletContext()

  const [address, proxyAddress, sync, collect, cancel, cancelv1, reswap] =
    useUserStore((st) => [
      st.address,
      st.proxyAddress,
      st.sync,
      st.collect,
      st.cancel,
      st.cancelv1,
      st.reswap,
    ])

  const handleCollect = (listing) => {
    if (address === null) {
      sync()
    } else {
      collect(listing)
    }
  }

  const proxyAdminAddress = get(nft, 'artist_profile.is_split')
    ? get(nft, 'artist_profile.split_contract.administrator_address')
    : null

  return (
    <>
      {nft.listings.length > 0 && (
        <Container>
          <Listings
            id={nft.token_id}
            listings={nft.listings}
            handleCollect={handleCollect}
            address={address}
            proxyAddress={proxyAddress}
            proxyAdminAddress={proxyAdminAddress}
            cancel={cancel}
            cancelv1={cancelv1}
            restricted={nft.restricted}
            reswap={reswap}
          />
        </Container>
      )}

      {/* {filtered.length === 0 ? undefined : ( */}
      <Container>
        <OwnerList owners={nft.holdings} />
      </Container>
      {/* )} */}
    </>
  )
}
