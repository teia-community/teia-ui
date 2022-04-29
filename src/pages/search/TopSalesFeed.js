import { useMemo } from 'react'
import { gql } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'
import TokenFeed from './TokenFeed'

function TopSalesFeed({ namespace, days = 1 }) {
  const startDay = useMemo(
    () =>
      new Date(new Date().getTime() - days * 60 * 60 * 24 * 1000).toISOString(),
    [days]
  )

  return (
    <TokenFeed
      namespace={namespace}
      resultsPath="trade"
      tokenPath="token"
      keyPath="token.id"
      postProcessTokens={(tokens) => uniqBy(uniqBy(tokens, 'id'), 'creator_id')}
      query={gql`
        query getTopSales($limit: Int!) {
          trade(where: {timestamp: {_gte: "${startDay}"}}, order_by: {swap: {price: desc}}, limit : $limit) {
            timestamp
            swap {
              price
            }
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

export default TopSalesFeed

export function TopSales1DFeed() {
  return <TopSalesFeed namespace="1d-feed" days={1} />
}

export function TopSales1WFeed() {
  return <TopSalesFeed namespace="1w-feed" days={7} />
}

export function TopSales1MFeed() {
  return <TopSalesFeed namespace="1m-feed" days={30} />
}
