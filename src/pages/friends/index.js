import React from 'react'
import useSWR from 'swr'
import uniq from 'lodash/uniq'
import { Page } from '@components/layout'
import TokenCollection from '@components/token-collection'
import { fetchGraphQLTezTok } from '@data/hicdex'
import { BaseTokenFieldsFragment } from '@data/api'
import { gql } from 'graphql-request'
import { useParams } from 'react-router'

async function fetchAllFrensAddresses(address) {
  const { errors, data } = await fetchGraphQLTezTok(
    `
    query collectorGallery($address: String!) {
      holdings(where: {holder_address: {_eq: $address}, amount: { _gt: 0 }, token: { artist_address: { _neq: $address }}}, order_by: {token_id: desc}) {
        token {
          artist_address
        }
      }
    }
  `,
    'collectorGallery',
    {
      address,
    }
  )

  if (errors) {
    console.error(errors)
    return []
  }

  return uniq(data.holdings.map((holding) => holding.token.artist_address))
}

export function Friends() {
  const { address } = useParams()

  const { data: wallets } = useSWR(
    ['/friends', address],
    async () => fetchAllFrensAddresses(address),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  return (
    <Page>
      <TokenCollection
        disable={!wallets}
        namespace="friends"
        variables={{ wallets }}
        swrParams={[address]}
        query={gql`
          ${BaseTokenFieldsFragment}
          query frensGallery($wallets: [String!], $limit: Int!) {
            tokens(
              where: {
                editions: { _gt: 0 }
                artist_address: { _in: $wallets }
                metadata_status: { _eq: "processed" }
              }
              order_by: { minted_at: desc_nulls_last }
              limit: $limit
            ) {
              ...baseTokenFields
            }
          }
        `}
      />
    </Page>
  )
}
