import { gql } from 'graphql-request'
import TokenCollection from '@atoms/token-collection'
import { BaseTokenFieldsFragment } from '@data/api'
import { useOutletContext } from 'react-router'

import { ProfileOutletContext } from './index'

export default function Curation() {
  const { showRestricted, overrideProtections, address } = useOutletContext<ProfileOutletContext>()

  return (
    <TokenCollection
      showRestricted={showRestricted}
      overrideProtections={overrideProtections}
      label="Artist's Curation"
      namespace="curation"
      swrParams={[address]}
      variables={{ address }}
      emptyMessage="no curated tokens"
      extractTokensFromResponse={(data) => {
        return data.listings.map(({ token, seller_address }) => ({
          ...token,
          listing_seller_address: seller_address,
          key: token.token_id,
        }))
      }}
      query={gql`
        ${BaseTokenFieldsFragment}
        query curatorGallery($address: String!) {
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
  )
}
