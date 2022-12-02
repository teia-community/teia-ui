import React, { useContext } from 'react'
import get from 'lodash/get'
import { Container, Padding } from '@components/layout'
import { OwnerList } from '@components/owner-list'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Listings } from '@components/listings'

export const Collectors = ({ nft }) => {
  const { syncTaquito, collect, acc, cancel, cancelv1, reswap } =
    useContext(HicetnuncContext)

  const handleCollect = (listing) => {
    if (acc === null) {
      syncTaquito()
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
          <Padding>
            <Listings
              id={nft.token_id}
              listings={nft.listings}
              handleCollect={handleCollect}
              acc={acc}
              proxyAdminAddress={proxyAdminAddress}
              cancel={cancel}
              cancelv1={cancelv1}
              restricted={nft.restricted}
              reswap={reswap}
            />
          </Padding>
        </Container>
      )}

      {/* {filtered.length === 0 ? undefined : ( */}
      <Container>
        <Padding>
          <OwnerList owners={nft.holdings} />
        </Padding>
      </Container>
      {/* )} */}
    </>
  )
}
