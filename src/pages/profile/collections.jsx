import { useState } from 'react'
import uniqBy from 'lodash/uniqBy'
import { gql } from 'graphql-request'
import TokenCollection from '@atoms/token-collection'
import Filters from './filters'
import { BaseTokenFieldsFragment } from '@data/api'

import { useOutletContext } from 'react-router'

const FILTER_ALL = 'ALL'
const FILTER_COLLECTED = 'FILTER_COLLECTED'

export default function Collections() {
  const { showFilters, showRestricted, overrideProtections, user_address } =
    useOutletContext()

  const [filter, setFilter] = useState(FILTER_ALL)

  return (
    <>
      {showFilters && (
        <Filters
          filter={filter}
          onChange={setFilter}
          items={[
            { type: FILTER_ALL, label: 'All' },
            { type: FILTER_COLLECTED, label: 'Collected' },
          ]}
        />
      )}
      {/* TODO (xat): do we need that v1 cancel-swap ui here again? */}
      <TokenCollection
        showRestricted={showRestricted}
        overrideProtections={overrideProtections}
        label="Artist's Collection"
        namespace="collections"
        swrParams={[user_address]}
        variables={{ address: user_address }}
        emptyMessage="no collections"
        maxItems={null}
        postProcessTokens={(tokens) => {
          switch (filter) {
            // Return all tokens that the user has collected but not created.
            // We used to FILTER_FOR_SALE and FILTER_NOT_FOR_SALE but no
            // reason for that. We want to see all items a user has collected
            // but not created here.  Users who wish to sell a token that
            // they have collected should still see it on their collections
            // page until it has been sold and would then not match the
            // user_address.
            case FILTER_COLLECTED:
              return tokens.filter(
                ({ artist_address }) => artist_address !== user_address
              )
            default:
              return tokens
          }
        }}
        extractTokensFromResponse={(data, { postProcessTokens }) => {
          const heldTokens = data.holdings.map(({ token }) => token)
          const swappedTokens = data.listings.map(
            ({ token, seller_address }) => ({
              ...token,
              listing_seller_address: seller_address,
            })
          )
          const tokens = uniqBy(
            [...heldTokens, ...swappedTokens],
            ({ token_id }) => token_id
          ).map((token) => ({ ...token, key: token.token_id }))

          return postProcessTokens(tokens)
        }}
        query={gql`
          ${BaseTokenFieldsFragment}
          query collectorGallery($address: String!) {
            holdings(
              where: {
                holder_address: { _eq: $address }
                token: {
                  artist_address: { _neq: $address }
                  metadata_status: { _eq: "processed" }
                }
                amount: { _gt: "0" }
              }
              order_by: { last_received_at: desc }
            ) {
              token {
                ...baseTokenFields
              }
            }
            listings(
              where: {
                token: { artist_address: { _neq: $address } }
                seller_address: { _eq: $address }
                status: { _eq: "active" }
              }
              distinct_on: token_id
            ) {
              seller_address
              token {
                ...baseTokenFields
              }
              contract_address
              amount_left
              price
            }
          }
        `}
      />
    </>
  )
}
