import useSWR from 'swr'
import uniq from 'lodash/uniq'
import TokenCollection from '@atoms/token-collection'
import { fetchGraphQL } from '@data/api'
import { BaseTokenFieldsFragment } from '@data/api'
import { gql } from 'graphql-request'
import { useParams } from 'react-router'
import styles from '@style'
async function fetchAllFrensAddresses(address) {
  const { errors, data } = await fetchGraphQL(
    gql`
      query collectorGallery($address: String!) {
        holdings(
          where: {
            holder_address: { _eq: $address }
            amount: { _gt: 0 }
            token: { artist_address: { _neq: $address } }
          }
          order_by: { token_id: desc }
        ) {
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

export function FriendsFeed() {
  const param = useParams()

  const { data: wallets } = useSWR(
    ['/feed/friends', param.address],
    async () => fetchAllFrensAddresses(param.address),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  return (
    <>
      <div className={styles.feed_info}>
        <p>
          {
            'This feed show OBJKTs of your collectors and artists you collected from.'
          }
        </p>
      </div>
      <TokenCollection
        feeds_menu
        disable={!wallets}
        label="Friends Feed"
        namespace="friends"
        variables={{ wallets }}
        swrParams={[param.address]}
        query={gql`
          ${BaseTokenFieldsFragment}
          query frensGallery($wallets: [String!], $limit: Int!) {
            tokens(
              where: {
                editions: { _gt: 0 }
                artist_address: { _in: $wallets }
                metadata_status: { _eq: "processed" }
              }
              order_by: { minted_at: desc }
              limit: $limit
            ) {
              ...baseTokenFields
            }
          }
        `}
      />
    </>
  )
}

export default FriendsFeed
