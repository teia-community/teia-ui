import { Container } from '@atoms/layout'
import { OwnerList } from '@components/owner-list'
import { Listings } from '@components/listings'
import { useUserStore } from '@context/userStore'
import { useObjktDisplayContext } from '..'

export const Collectors = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft } = useObjktDisplayContext()

  const [address, sync, collect] = useUserStore((st) => [
    st.address,
    st.sync,
    st.collect,
  ])

  const handleCollect = (listing) => {
    if (address == null) {
      sync()
    } else {
      collect(listing)
    }
  }

  const proxyAdminAddress =
    nft.artist_profile?.split_contract?.administrator_address

  return (
    <>
      {nft.listings.length > 0 && (
        <Container>
          <Listings
            nft={nft}
            handleCollect={handleCollect}
            proxyAdminAddress={proxyAdminAddress}
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
