import React, { useContext } from 'react'
import get from 'lodash/get'
import { Container } from '@atoms/layout'
import { OwnerList } from '@components/owner-list'
import { TeiaContext } from '@context/TeiaContext'
import { Listings } from '@components/listings'

/**
 * @param {Object} collectorsOptions
 * @param {import("@types").NFT} collectorsOptions.nft
 **/
export const Collectors = ({ nft }) => {
  const { syncTaquito, collect, acc, cancel, cancelv1, reswap } =
    useContext(TeiaContext)

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
