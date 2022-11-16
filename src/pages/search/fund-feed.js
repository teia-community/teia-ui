import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import TokenFeed from './token-feed'
import styles from './styles.module.scss'

function FundFeed({
  minShares = 50,
  introText,
  infoUrl,
  contractAddress,
  namepsace,
  tags = null,
}) {
  return (
    <div>
      <div className={styles.feed_info}>
        <p>{introText}</p>

        <a href={infoUrl} target="_blank" rel="noreferrer">
          More infos <strong>here</strong>
        </a>
      </div>
      <TokenFeed
        namespace={namepsace}
        extractTokensFromResponse={({ tokens_by_share, tokens_by_tag }) => {
          const tokensFromSplitContract = orderBy(
            uniqBy(
              [
                ...flatten(
                  tokens_by_share.map(({ contract }) => {
                    const total = contract.shares[0].total_shares

                    return flatten(
                      contract.shares[0].shareholder
                        .map((shareholder) => {
                          if (
                            [contractAddress].includes(shareholder.holder_id) &&
                            (shareholder.shares / total) * 100 >= minShares
                          ) {
                            return contract.tokens
                          }
                          return undefined
                        })
                        .filter((tokens) => tokens !== undefined)
                    )
                  })
                ),
                ...(tokens_by_tag ? tokens_by_tag : []),
              ].map((token) => ({ ...token, key: token.id })),
              ({ key }) => key
            ),
            ['timestamp'],
            ['desc']
          )

          return tokensFromSplitContract
        }}
        query={gql`
        query GetCollabTokens($limit: Int!) {
          tokens_by_share: split_contract(limit: $limit, where: {shareholder: {holder_id: {_eq: "${contractAddress}"}}}) {
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
          ${
            tags
              ? `
            tokens_by_tag: token(where: {token_tags: {tag: {tag: {_in: [${tags.map(
              (tag) => `"${tag}"`
            )}]}}}, supply: {_neq: "0"}}, limit: $limit, order_by: { id: desc }) {
              id
              artifact_uri
              display_uri
              mime
              creator_id
              token_tags {
                tag {
                  tag
                }
              }
              creator {
                address
                name
              }
              content_rating
              title
            }
          `
              : ''
          }
        }
      `}
      />
    </div>
  )
}

export default FundFeed
