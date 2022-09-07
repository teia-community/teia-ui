import React, { useState } from 'react'
import { gql } from 'graphql-request'
import { Container } from '@components/layout'
import { SUPPORTED_MARKETPLACE_CONTRACTS } from '@constants'
import TokenMasonry from './token-masonry'
import Filters from './filters'

const FILTER_ALL = 'ALL'
const FILTER_PRIMARY = 'PRIMARY'
const FILTER_SECONDARY = 'SECONDARY'
const FILTER_NOT_FOR_SALE = 'NOT_FOR_SALE'

export default function Creations({ showFilters, address }) {
  const [filter, setFilter] = useState(FILTER_ALL)

  return (
    <div>
      {showFilters && (
        <Filters
          filter={filter}
          onChange={setFilter}
          items={[
            { type: FILTER_ALL, label: 'All' },
            { type: FILTER_PRIMARY, label: 'Primary' },
            { type: FILTER_SECONDARY, label: 'Secondary' },
            { type: FILTER_NOT_FOR_SALE, label: 'Not for sale' },
          ]}
        />
      )}
      <Container xlarge>
        {/* TODO (xat): do we need that v1 cancel-swap ui here again? */}
        <TokenMasonry
          namespace="creations"
          variables={{ address }}
          emptyMessage="no creations"
          postProcessTokens={(tokens) => {
            if (filter === FILTER_PRIMARY) {
              return tokens.filter((token) => {
                return token.swaps.some(
                  (swap) =>
                    swap.status === 0 &&
                    SUPPORTED_MARKETPLACE_CONTRACTS.includes(
                      swap.contract_address
                    ) &&
                    swap.creator_id === address
                )
              })
            }

            if (filter === FILTER_SECONDARY) {
              return tokens.filter((token) => {
                return token.swaps.some(
                  (swap) => swap.status === 0 && swap.creator_id !== address
                )
              })
            }

            if (filter === FILTER_NOT_FOR_SALE) {
              return tokens.filter((token) => token.swaps.length === 0)
            }

            // all tokens
            return tokens
          }}
          query={gql`
            query creatorGallery($address: String!) {
              token(
                where: {
                  creator: { address: { _eq: $address } }
                  supply: { _gt: 0 }
                }
                order_by: { id: desc }
              ) {
                id
                artifact_uri
                display_uri
                mime
                title
                description
                swaps(
                  order_by: { price: asc }
                  limit: 1
                  where: { amount_left: { _gte: "1" }, status: { _eq: "0" } }
                ) {
                  id
                  status
                  amount_left
                  creator_id
                  contract_address
                  creator {
                    address
                  }
                  price
                }
              }
            }
          `}
        />
      </Container>
    </div>
  )
}
