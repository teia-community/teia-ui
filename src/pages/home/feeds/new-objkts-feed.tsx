import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import { BaseTokenFieldsFragment } from '@data/queries'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'
import type { Token_Metadata } from 'gql'

export function NewObjktsFeed() {
  return (
    <TokenCollection
      feeds_menu
      label="New OBJKTs"
      namespace="new-objkts-feed"
      maxItems={600}
      postProcessTokens={(tokens: Token_Metadata[]) =>
        uniqBy(tokens, 'artist_address')
      }
      query={gql`
        ${BaseTokenFieldsFragment}
        query getNewObjkt($limit: Int!) {
          tokens(
            where: { editions: { _gt: "0" }, metadata_status: { _eq: "processed" }, fa2_address: { _eq: "${HEN_CONTRACT_FA2}"} }
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

export default NewObjktsFeed
