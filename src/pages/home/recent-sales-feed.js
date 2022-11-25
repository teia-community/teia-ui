import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import TokenFeed from './token-feed'
import { BaseTokenFieldsFragment } from '../../data/api'
import { HEN_CONTRACT_FA2 } from '../../constants'

function RecentSalesFeed() {
  return (
    <TokenFeed
      namespace="recent-sales-feed"
      resultsPath="events"
      tokenPath="token"
      keyPath="token.token_id"
      postProcessTokens={(tokens) =>
        uniqBy(uniqBy(tokens, 'token_id'), 'artist_address')
      }
      query={gql`
        ${BaseTokenFieldsFragment}
        query getLatestSales($limit: Int!) {
          events(limit: $limit, order_by: [{level: desc, opid: desc}], where: {token: {metadata_status: {_eq: "processed"}}, implements: {_eq: "SALE"}, fa2_address: {_eq: "${HEN_CONTRACT_FA2}"}}) {
            type
            timestamp
            token {
              ...baseTokenFields
            }
          }
        }
      `}
    />
  )
}

export default RecentSalesFeed
