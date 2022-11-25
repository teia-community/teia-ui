import { gql } from 'graphql-request'
import TokenFeed from './token-feed'
import { BaseTokenFieldsFragment } from '../../data/api'
import { HEN_CONTRACT_FA2 } from '../../constants'

function TagFeed({ tag, namespace }) {
  return (
    <TokenFeed
      namespace={namespace}
      variables={{ tag }}
      swrParams={[tag]}
      query={gql`
        ${BaseTokenFieldsFragment}
        query getObjktsByTag($tag: String!, $limit: Int!) {
          tokens(
            where: {
              tags: { tag: { _eq: $tag } },
              editions: { _neq: 0 },
              fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
            }
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

export default TagFeed
