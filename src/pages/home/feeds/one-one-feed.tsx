import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'

import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'
import { BaseTokenFieldsFragment } from '@data/queries'
import type { Token_Metadata } from 'gql'

export function OneOnOneFeed() {
  return (
    <TokenCollection
      feeds_menu
      label="1/1 OBJKTs"
      namespace="one-on-one-feed"
      maxItems={600}
      postProcessTokens={(tokens: Token_Metadata[]) =>
        uniqBy(tokens, 'artist_address')
      }
      query={gql`
        ${BaseTokenFieldsFragment}
        query getUnoUno($limit: Int!) {
          tokens(
            where: { metadata_status: { _eq: "processed" }, fa2_address: { _eq: "${HEN_CONTRACT_FA2}"}, editions: {_eq: 1} }
            order_by: { minted_at: desc }
            limit: $limit

          ) {
            ...baseTokenFields
          }
        }
      `}
    />
  )
}

export default OneOnOneFeed
