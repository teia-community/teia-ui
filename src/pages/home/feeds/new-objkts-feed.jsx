import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'

export function NewObjktsFeed() {
  return (
    <TokenCollection
      feeds_menu
      label="New OBJKTs"
      namespace="new-objkts-feed"
      maxItems={600}
      paginate
      postProcessTokens={(tokens) => uniqBy(tokens, 'artist_address')}
      query={gql`
        ${BaseTokenFieldsFragment}
        query getNewObjkt($limit: Int!, $offset: Int = 0, $filters: tokens_bool_exp!) {
          tokens(
            where: { editions: { _gt: "0" }, metadata_status: { _eq: "processed" }, fa2_address: { _eq: "${HEN_CONTRACT_FA2}"}, _and: [$filters] }
            order_by: { minted_at: desc }
            limit: $limit
            offset: $offset

          ) {
            ...baseTokenFields
          }
        }
      `}
    />
  )
}

export default NewObjktsFeed
