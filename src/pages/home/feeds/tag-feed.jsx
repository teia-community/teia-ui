import { gql } from 'graphql-request'
import TokenCollection from '@atoms/token-collection'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'

export function TagFeed({ tag, ...otherProps }) {
  return (
    <TokenCollection
      feeds_menu
      label={tag}
      variables={{ tag }}
      swrParams={[tag]}
      maxItems={600}
      query={gql`
        ${BaseTokenFieldsFragment}
        query getObjktsByTag($tag: String!, $limit: Int!) {
          tokens(
            where: {
              tags: { tag: { _eq: $tag } },
              editions: { _neq: 0 },
              fa2_address: { _eq: "${HEN_CONTRACT_FA2}" },
              metadata_status: { _eq: "processed" }
            }
            order_by: { minted_at: desc }
            limit: $limit
          ) {
            ...baseTokenFields
          }
        }
      `}
      {...otherProps}
    />
  )
}

export default TagFeed
