import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import flatten from 'lodash/flatten'
import TokenFeed from './token-feed'
import { PAKISTAN_FUNDING_CONTRACT } from '../../constants'
import styles from './styles.module.scss'

function PakistanFeed({ minShares = 50 }) {
  return (
    <div>
      <div className={styles.feed_info}>
        <p>
          This feed shows OBJKTs minted with the Pakistan donation address as
          beneficiary of at least 50% of sales volume.
        </p>

        <a
          href="https://github.com/teia-community/teia-docs/wiki/Pakistan-Fundraiser"
          target="_blank"
          rel="noreferrer"
        >
          More infos <strong>here</strong>
        </a>
      </div>
      <TokenFeed
        namespace="pakistan-feed"
        extractTokensFromResponse={({ split_contract }) => {
          return orderBy(
            flatten(
              split_contract.map(({ contract }) => {
                const total = contract.shares[0].total_shares

                return flatten(
                  contract.shares[0].shareholder
                    .map((shareholder) => {
                      if (
                        [PAKISTAN_FUNDING_CONTRACT].includes(
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
          split_contract(limit: $limit, where: {shareholder: {holder_id: {_eq: "${PAKISTAN_FUNDING_CONTRACT}"}}, contract: {tokens: {supply: {_gt: "0"}, _and: {is_signed: {_eq: true}}}}}) {
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
              tokens(order_by: {timestamp: desc}) {
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

export default PakistanFeed
