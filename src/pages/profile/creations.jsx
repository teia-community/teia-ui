import React, { useContext, useEffect, useState } from 'react'
import { gql } from 'graphql-request'
import get from 'lodash/get'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'
import Filters from './filters'
import { TeiaContext } from '@context/TeiaContext'
import { useOutletContext } from 'react-router'

const FILTER_ALL = 'ALL'
const FILTER_PRIMARY = 'PRIMARY'
const FILTER_SECONDARY = 'SECONDARY'
const FILTER_NOT_FOR_SALE = 'NOT_FOR_SALE'

export default function Creations() {
  const { showFilters, show_restricted, address } = useOutletContext()
  const [filter, setFilter] = useState(FILTER_ALL)
  const { setProfileFeed } = useContext(TeiaContext)
  useEffect(() => {
    setProfileFeed(true)
  }, [setProfileFeed])

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
        show_restricted={show_restricted}
        label="Artist's Creations"
        namespace="creations"
        swrParams={[address]}
        variables={{ address }}
        emptyMessage="no creations"
        maxItems={null}
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
              tokens(
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
            }
          `}
      />
    </>
  )
}
