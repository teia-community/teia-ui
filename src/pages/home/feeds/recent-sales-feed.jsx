import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import TokenCollection from '@atoms/token-collection'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'

export function RecentSalesFeed() {
  return (
    <TokenCollection
      feeds_menu
      label="Recent Sales"
      namespace="recent-sales-feed"
      resultsPath="events"
      tokenPath="token"
      keyPath="token.token_id"
      maxItems={600}
      paginate
      postProcessTokens={(tokens) =>
        uniqBy(uniqBy(tokens, 'token_id'), 'artist_address')
      }
      query={gql`
        ${BaseTokenFieldsFragment}
        query getLatestSales($limit: Int!, $offset: Int = 0, $filters: tokens_bool_exp!) {
          events(limit: $limit, offset: $offset, order_by: [{level: desc, opid: desc}], where: {token: {metadata_status: {_eq: "processed"}, _and: [$filters]}, implements: {_eq: "SALE"}, fa2_address: {_eq: "${HEN_CONTRACT_FA2}"}}) {
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
