import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import { BaseTokenFieldsFragment } from '../../data/api'
import { HEN_CONTRACT_FA2 } from '../../constants'
import TokenFeed from './token-feed'

function NewObjktsFeed() {
  return (
    <TokenFeed
      namespace="new-objkts-feed"
      postProcessTokens={(tokens) => uniqBy(tokens, 'artist_address')}
      query={gql`
        ${BaseTokenFieldsFragment}
        query getNewObjkt($limit: Int!) {
          tokens(
            where: { metadata_status: { _eq: "processed" }, fa2_address: { _eq: "${HEN_CONTRACT_FA2}"} }
            order_by: { minted_at: desc_nulls_last }
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
