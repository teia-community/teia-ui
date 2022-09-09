import React, { useState } from 'react'
import orderBy from 'lodash/orderBy'
import { gql } from 'graphql-request'
import { Container } from '@components/layout'
import { SUPPORTED_MARKETPLACE_CONTRACTS } from '@constants'
import TokenMasonry from './token-masonry'
import Filters from './filters'

const FILTER_ALL = 'ALL'
const FILTER_FOR_SALE = 'FOR_SALE'
const FILTER_NOT_FOR_SALE = 'NOT_FOR_SALE'

export default function Collections({ showFilters, address }) {
  const [filter, setFilter] = useState(FILTER_ALL)

  return (
    <div>
      {showFilters && (
        <Filters
          filter={filter}
          onChange={setFilter}
          items={[
            { type: FILTER_ALL, label: 'All' },
            { type: FILTER_FOR_SALE, label: 'For sale' },
            { type: FILTER_NOT_FOR_SALE, label: 'Not for sale' },
          ]}
        />
      )}
      <Container xlarge>
        {/* TODO (xat): do we need that v1 cancel-swap ui here again? */}
        <TokenMasonry
          namespace="collections"
          swrParams={[address]}
          variables={{ address }}
          emptyMessage="no collections"
          postProcessTokens={(tokens) => {
            if (filter === FILTER_FOR_SALE) {
              return tokens.filter(
                ({ swap_creator_id }) => swap_creator_id === address
              )
            }

            if (filter === FILTER_NOT_FOR_SALE) {
              return tokens.filter(
                ({ swap_creator_id, creator }) =>
                  creator.address !== address && swap_creator_id !== address
              )
            }

            return tokens
          }}
          extractTokensFromResponse={(data, { postProcessTokens }) => {
            const heldTokens = data.token_holder.map(({ token }) => token)
            const swappedTokens = data.swap.map(({ token, creator_id }) => ({
              ...token,
              swap_creator_id: creator_id,
            }))
            const tokens = [...swappedTokens, ...heldTokens]

            return postProcessTokens(orderBy(tokens, 'id').reverse())
          }}
          query={gql`
            query collectorGallery($address: String!) {
              token_holder(
                where: {
                  holder_id: { _eq: $address }
                  token: { creator: { address: { _neq: $address } } }
                  quantity: { _gt: "0" }
                }
                order_by: { token_id: desc }
              ) {
                token {
                  id
                  artifact_uri
                  display_uri
                  thumbnail_uri
                  timestamp
                  mime
                  title
                  description
                  supply
                  royalties
                  creator {
                    address
                    name
                  }
                }
              }
              swap(where: {token: {creator: {address: {_neq: $address}}}, creator_id: {_eq: $address}, status: {_eq: "0"}, contract_address: { _in : [${SUPPORTED_MARKETPLACE_CONTRACTS.map(
                (contractAddress) => `"${contractAddress}"`
              ).join(', ')}] }}, distinct_on: token_id) {
                creator_id
                token {
                  id
                  title
                  artifact_uri
                  display_uri
                  mime
                  description
                  supply
                  royalties
                  creator {
                    name
                    address
                  }
                }
                contract_address
                amount_left
                price
                id
              }
            }
          `}
        />
      </Container>
    </div>
  )
}
