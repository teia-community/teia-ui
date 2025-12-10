import { useState } from 'react'
import { gql } from 'graphql-request'
import get from 'lodash/get'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'
import Filters from './filters'

import { useOutletContext } from 'react-router'
import { orderBy } from 'lodash'

const FILTER_ALL = 'ALL'
const FILTER_PRIMARY = 'PRIMARY'
const FILTER_SECONDARY = 'SECONDARY'
const FILTER_NOT_FOR_SALE = 'NOT_FOR_SALE'

export default function Creations() {
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
            { type: FILTER_PRIMARY, label: 'Primary' },
            { type: FILTER_SECONDARY, label: 'Secondary' },
            { type: FILTER_NOT_FOR_SALE, label: 'Not for sale' },
          ]}
        />
      )}
      {/* TODO (xat): do we need that v1 cancel-swap ui here again? */}
      <TokenCollection
        showRestricted={showRestricted}
        overrideProtections={overrideProtections}
        label="Artist's Creations"
        namespace="creations"
        swrParams={[address]}
        variables={{ address }}
        emptyMessage="no creations"
        maxItems={null}
        extractTokensFromResponse={(data) => {
          const tokens = data.artist_tokens
          const collab_tokens = data.artist_single_collabs
            .map((collab) => {
              if (collab?.split_contract?.created_tokens) {
                if (collab.split_contract.shareholders.length === 1) {
                  return collab?.split_contract?.created_tokens
                }
              }
              return []
            })
            .flat()

          return orderBy([...tokens, ...collab_tokens], ['minted_at'])
            .reverse()
            .map((token) => ({ ...token, key: token.token_id }))
        }}
        postProcessTokens={(tokens) => {
          if (filter === FILTER_PRIMARY) {
            return tokens.filter(
              (token) =>
                get(token, 'lowest_price_listing.seller_address') === address
            )
          }

          if (filter === FILTER_SECONDARY) {
            return tokens.filter(
              (token) =>
                get(token, 'lowest_price_listing.seller_address') !== address
            )
          }

          if (filter === FILTER_NOT_FOR_SALE) {
            return tokens.filter(
              (token) => get(token, 'lowest_price_listing') === null
            )
          }

          // all tokens
          return tokens
        }}
        query={gql`
            ${BaseTokenFieldsFragment}
            query creatorGallery($address: String!) {
              artist_tokens: tokens(
                where: {
                  artist_address: { _eq: $address }
                  editions: { _gt: 0 }
                  fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
                  metadata_status: { _eq: "processed" }
                }
                order_by: { minted_at: desc }
              ) {
                ...baseTokenFields
                lowest_price_listing
              }
              artist_single_collabs: teia_shareholders(
                where: { 
                  shareholder_address: { _eq: $address}, 
                  holder_type: { _eq: "core_participant" } 
                }) {
                split_contract{
                  shareholders(where:{holder_type:{_eq:"core_participant"}}) {
                    shareholder_address
                  }
                  created_tokens(where:{editions:{_gt:"0"}, teia_meta:{is_signed:{_eq:true}}}){
                    ...baseTokenFields
                    lowest_price_listing
                  }
                }
              }
            }
          `}
      />
    </>
  )
}
