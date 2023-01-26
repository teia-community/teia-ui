import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'

function NewObjktsFeed() {
  return (
    <TokenCollection
      feeds_menu
      namespace="new-objkts-feed"
      maxItems={600}
      postProcessTokens={(tokens) => uniqBy(tokens, 'artist_address')}
      query={gql`
        ${BaseTokenFieldsFragment}
        query getNewObjkt($limit: Int!) {
          tokens(
            where: { metadata_status: { _eq: "processed" }, fa2_address: { _eq: "${HEN_CONTRACT_FA2}"} }
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
