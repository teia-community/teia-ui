import uniqBy from 'lodash/uniqBy'
import { gql } from 'graphql-request'
import TokenCollection from '@atoms/token-collection'
import Filters from './filters'
import { BaseTokenFieldsFragment } from '@data/api'

import { useOutletContext } from 'react-router'
import { useSearchParams } from 'react-router-dom'

const FILTER_ALL = 'ALL'
const FILTER_NOT_FOR_SALE = 'NOT_FOR_SALE'
const FILTER_PRIMARY = 'PRIMARY'
const FILTER_SECONDARY = 'SECONDARY'

export default function Collections() {
  const { showRestricted, overrideProtections, address } = useOutletContext()

  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('filter') || FILTER_ALL

  const setFilter = (value) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        value === FILTER_ALL ? next.delete('filter') : next.set('filter', value)
        return next
      },
      { preventScrollReset: true }
    )

  return (
    <>
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
          if (filter === FILTER_NOT_FOR_SALE) {
            return tokens.filter(({ listings }) => !listings?.length)
          }

          if (filter === FILTER_PRIMARY) {
            // Listed directly by the original artist
            return tokens.filter(({ listings, artist_address }) =>
              listings?.some((l) => l.seller_address === artist_address)
            )
          }

          if (filter === FILTER_SECONDARY) {
            // Listed by a collector (anyone other than the original artist)
            return tokens.filter(({ listings, artist_address }) =>
              listings?.some((l) => l.seller_address !== artist_address)
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
                listings(
                  where: { status: { _eq: "active" } }
                  order_by: { price: asc }
                ) {
                  seller_address
                }
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
                listings(
                  where: { status: { _eq: "active" } }
                  order_by: { price: asc }
                ) {
                  seller_address
                }
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
