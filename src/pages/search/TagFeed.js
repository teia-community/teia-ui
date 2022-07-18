import { gql } from 'graphql-request'
import TokenFeed from './TokenFeed'

function TagFeed({ tag, namespace }) {
  return (
    <TokenFeed
      namespace={namespace}
      variables={{ tag }}
      swrParams={[tag]}
      query={gql`
        query getObjktsByTag($tag: String!, $limit: Int!) {
          token(
            where: {
              token_tags: { tag: { tag: { _eq: $tag } } }
              supply: { _gt: "0" }
            }
            order_by: { id: desc }
            limit: $limit
          ) {
            id
            artifact_uri
            display_uri
            creator_id
            mime
            creator {
              address
              name
            }
          }
        }
      `}
    />
  )
}

export default TagFeed
