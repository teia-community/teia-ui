import React, { useContext } from 'react'
import { Container, Padding } from '@components/layout'
import { OwnerList } from '@components/owner-list'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Listings } from '@components/listings'

export const Collectors = ({ nft }) => {
  const {
    syncTaquito,
    collect,
    fulfillObjktcomAsk,
    acc,
    cancel,
    cancelv1,
    reswap,
    block_list,
  } = useContext(HicetnuncContext)

  const handleCollect = (contract_address, swap_id, price) => {
    if (acc === null) {
      syncTaquito()
    } else {
      collect(contract_address, swap_id, price)
    }
  }

  const handleCollectObjktcomAsk = (ask) => {
    if (acc === null) {
      syncTaquito()
    } else {
      fulfillObjktcomAsk(ask)
    }
  }

  const proxyAdminAddress = nft.creator.is_split
    ? nft.creator.shares[0].administrator
    : null

  return (
    <>
      {nft.listings.length > 0 && (
        <Container>
          <Padding>
            <Listings
              id={nft.id}
              listings={nft.listings}
              handleCollect={handleCollect}
              handleCollectObjktcomAsk={handleCollectObjktcomAsk}
              acc={acc}
              proxyAdminAddress={proxyAdminAddress}
              cancel={cancel}
              cancelv1={cancelv1}
              restricted={nft.restricted}
              ban={block_list}
              reswap={reswap}
            />
          </Padding>
        </Container>
      )}

      {/* {filtered.length === 0 ? undefined : ( */}
      <Container>
        <Padding>
          <OwnerList owners={nft.token_holders} />
        </Padding>
      </Container>
      {/* )} */}
    </>
  )
}
