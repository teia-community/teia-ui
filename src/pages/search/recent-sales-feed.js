import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import TokenFeed from './token-feed'

function RecentSalesFeed() {
  return (
    <TokenFeed
      namespace="recent-sales-feed"
      resultsPath="trade"
      tokenPath="token"
      keyPath="token.id"
      postProcessTokens={(tokens) => uniqBy(uniqBy(tokens, 'id'), 'creator_id')}
      query={gql`
        query getLatestSales($limit: Int!) {
          trade(
            order_by: { timestamp: desc }
            limit: $limit
            where: { swap: { price: { _gte: "0" } } }
          ) {
            timestamp
            token {
              artifact_uri
              display_uri
              id
              mime
              creator_id
              creator {
                name
                address
              }
            }
          }
        }
      `}
    />
  )
}

export default RecentSalesFeed
