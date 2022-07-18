import { useMemo } from 'react'
import { gql } from 'graphql-request'
import random from 'lodash/random'
import TokenFeed from './TokenFeed'

// lastId should be updated every once in a while
function RandomFeed({ firstId = 196, lastId = 720000, max = 15 }) {
  const tokenIds = useMemo(() => {
    const uniqueIds = new Set()

    while (uniqueIds.size < max) {
      uniqueIds.add(random(firstId, lastId))
    }

    return Array.from(uniqueIds)
  }, [firstId, lastId, max])

  return (
    <TokenFeed
      namespace="random-feed"
      enableInfinityScroll={false}
      variables={{ tokenIds }}
      query={gql`
        query Objkts($tokenIds: [bigint!] = "") {
          token(where: { id: { _in: $tokenIds }, supply: { _neq: 0 } }) {
            artifact_uri
            creator_id
            display_uri
            hdao_balance
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

export default RandomFeed
