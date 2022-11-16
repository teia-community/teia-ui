import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import flatten from 'lodash/flatten'
import TokenFeed from './token-feed'
import { IRAN_FUNDING_CONTRACT } from '../../constants'
import styles from './styles.module.scss'

function IranFeed({ minShares = 50 }) {
  return (
    <div>
      <div className={styles.feed_info}>
        <p>
          This feed shows OBJKTs minted with the Iran donation address as
          beneficiary of at least 50% of sales volume or tagged with #Tezos4Iran
        </p>

        <a
          href="https://github.com/teia-community/teia-docs/wiki/Tezos-for-Iran"
          target="_blank"
          rel="noreferrer"
        >
          More infos <strong>here</strong>
        </a>
      </div>
      <TokenFeed
        namespace="iran-feed"
        extractTokensFromResponse={({ split_contract }) => {
          return orderBy(
            flatten(
              split_contract.map(({ contract }) => {
                const total = contract.shares[0].total_shares

                return flatten(
                  contract.shares[0].shareholder
                    .map((shareholder) => {
                      if (
                        [IRAN_FUNDING_CONTRACT].includes(
                          shareholder.holder_id
                        ) &&
                        (shareholder.shares / total) * 100 >= minShares
                      ) {
                        return contract.tokens
                      }
                      return undefined
                    })
                    .filter((tokens) => tokens !== undefined)
                )
              })
            ).map((token) => ({ ...token, key: token.id })),
            ['timestamp'],
            ['desc']
          )
        }}
        query={gql`
        query GetCollabTokens($limit: Int!) {
          split_contract(limit: $limit, where: {shareholder: {holder_id: {_eq: "${IRAN_FUNDING_CONTRACT}"}}}) {
            contract {
              address
              name
              shares {
                total_shares
                shareholder {
                  holder_id
                  shares
                }
              }
              tokens(where: {supply: {_gt: "0"}, is_signed: {_eq: true}}, order_by: {timestamp: desc}) {
                id
                artifact_uri
                display_uri
                thumbnail_uri
                timestamp
                mime
                title
                description
                supply
                royalties
                creator {
                  name
                  address
                }
              }
            }
          }
        }
      `}
      />
    </div>
  )
}

export default IranFeed
