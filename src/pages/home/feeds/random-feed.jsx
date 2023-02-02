import { useMemo } from 'react'
import { gql } from 'graphql-request'
import random from 'lodash/random'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'

// TODO: Fetch last ID from the indexer
export function RandomFeed({ firstId = 196, lastId = 1_592_463, max = 200 }) {
  const tokenIds = useMemo(() => {
    const uniqueIds = new Set()

    while (uniqueIds.size < max) {
      uniqueIds.add(`${random(firstId, lastId)}`)
    }

    return Array.from(uniqueIds)
  }, [firstId, lastId, max])

  return (
    <TokenCollection
      feeds_menu
      label="Random"
      namespace="random-feed"
      enableInfinityScroll={false}
      variables={{ tokenIds }}
      maxItems={200}
      query={gql`
        ${BaseTokenFieldsFragment}
        query Objkts($tokenIds: [String!] = "", $limit: Int!) {
          tokens(where: { token_id: { _in: $tokenIds }, editions: { _neq: 0 }, fa2_address: { _eq: "${HEN_CONTRACT_FA2}" } }, limit: $limit) {
            ...baseTokenFields
          }
        }
      `}
    />
  )
}

export default RandomFeed
