import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import TokenFeed from './TokenFeed'

function NewObjktsFeed() {
  return (
    <TokenFeed
      namespace="new-objkts-feed"
      postProcessTokens={(tokens) => uniqBy(tokens, 'creator_id')}
      query={gql`
        query getNewObjkt($limit: Int!) {
          token(
            order_by: { id: desc }
            limit: $limit
            where: { artifact_uri: { _neq: "" } }
          ) {
            artifact_uri
            display_uri
            creator_id
            id
            mime
            thumbnail_uri
            timestamp
            title
            creator {
              name
              address
            }
          }
        }
      `}
    />
  )
}

export default NewObjktsFeed
