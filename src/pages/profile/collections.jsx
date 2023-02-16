import { useState } from 'react'
import uniqBy from 'lodash/uniqBy'
import { gql } from 'graphql-request'
import TokenCollection from '@atoms/token-collection'
import Filters from './filters'
import { BaseTokenFieldsFragment } from '@data/api'

import { useOutletContext } from 'react-router'

const FILTER_ALL = 'ALL'
const FILTER_FOR_SALE = 'FOR_SALE'
const FILTER_NOT_FOR_SALE = 'NOT_FOR_SALE'

export default function Collections() {
  const { showFilters, showRestricted, overrideProtections, address } =
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
            { type: FILTER_FOR_SALE, label: 'For sale' },
            { type: FILTER_NOT_FOR_SALE, label: 'Not for sale' },
          ]}
        />
      )}
      {/* TODO (xat): do we need that v1 cancel-swap ui here again? */}
      <TokenCollection
        showRestricted={showRestricted}
        overrideProtections={overrideProtections}
        label="Artist's Collection"
        namespace="collections"
        swrParams={[address]}
        variables={{ address }}
        emptyMessage="no collections"
        maxItems={null}
        postProcessTokens={(tokens) => {
          if (filter === FILTER_FOR_SALE) {
            return tokens.filter(
              ({ listing_seller_address }) => listing_seller_address === address
            )
          }

          if (filter === FILTER_NOT_FOR_SALE) {
            return tokens.filter(
              ({ listing_seller_address, artist_address }) =>
                artist_address !== address && listing_seller_address !== address
            )
          }

          return tokens
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
