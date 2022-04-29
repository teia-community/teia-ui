import { gql } from 'graphql-request'
import TokenFeed from './TokenFeed'
import { useSearchParams } from 'react-router-dom'

function SearchFeed() {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''

  return (
    <TokenFeed
      namespace="search-feed"
      variables={{ tag: searchTerm }}
      swrParams={[searchTerm]}
      query={gql`
        query getObjktsByTag($tag: String = "3d", $limit: Int!) {
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

export default SearchFeed
