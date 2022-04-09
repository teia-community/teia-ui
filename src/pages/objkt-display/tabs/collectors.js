import React, { useContext } from 'react'
import { Container, Padding } from '@components/layout'
import { OwnerList } from '@components/owner-list'
import { HicetnuncContext } from '@context/HicetnuncContext'
import { Listings } from '@components/listings'

export const Collectors = ({
  id,
  creator,
  listings,
  token_holders,
  restricted,
  ban,
}) => {
  const {
    syncTaquito,
    collect,
    fulfillObjktcomAsk,
    acc,
    cancel,
    cancelv1,
    reswap,
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

  const proxyAdminAddress = creator.is_split
    ? creator.shares[0].administrator
    : null

  return (
    <>
      {listings.length > 0 && (
        <Container>
          <Padding>
            <Listings
              id={id}
              listings={listings}
              handleCollect={handleCollect}
              handleCollectObjktcomAsk={handleCollectObjktcomAsk}
              acc={acc}
              proxyAdminAddress={proxyAdminAddress}
              cancel={cancel}
              cancelv1={cancelv1}
              restricted={restricted}
              ban={ban}
              reswap={reswap}
            />
          </Padding>
        </Container>
      )}

      {/* {filtered.length === 0 ? undefined : ( */}
      <Container>
        <Padding>
          <OwnerList owners={token_holders} />
        </Padding>
      </Container>
      {/* )} */}
    </>
  )
}
