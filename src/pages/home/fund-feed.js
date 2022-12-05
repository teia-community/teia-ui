import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import TokenCollection from '../../components/token-collection'
import { BaseTokenFieldsFragment } from '@data/api'
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
      <TokenCollection
        namespace={namepsace}
        extractTokensFromResponse={({ tokens_by_share, tokens_by_tag }) => {
          const tokensFromSplitContract = orderBy(
            uniqBy(
              [
                ...flatten(
                  tokens_by_share.map(
                    ({ total_shares, shareholders, created_tokens }) => {
                      return flatten(
                        shareholders
                          .map((shareholder) => {
                            if (
                              [contractAddress].includes(
                                shareholder.shareholder_address
                              ) &&
                              (shareholder.shares / total_shares) * 100 >=
                                minShares
                            ) {
                              return created_tokens
                            }
                            return undefined
                          })
                          .filter((tokens) => tokens !== undefined)
                      )
                    }
                  )
                ),
                ...(tokens_by_tag ? tokens_by_tag : []),
              ].map((token) => ({ ...token, key: token.token_id })),
              ({ key }) => key
            ),
            ['minted_at'],
            ['desc']
          )

          return tokensFromSplitContract
        }}
        query={gql`
        ${BaseTokenFieldsFragment}
        query GetCollabTokens($limit: Int!) {
          tokens_by_share: teia_split_contracts(limit: $limit, where: {shareholders: {shareholder_address: {_eq: "${contractAddress}"}}}) {
            contract_profile {
              name
            }
            total_shares
            shareholders {
              shareholder_address
              shares
            }
            created_tokens(where: {editions: {_gt: "0"}, teia_meta: { is_signed: { _eq: true }}}, order_by: { minted_at: desc_nulls_last }) {
              ...baseTokenFields
            }
          }
          ${
            tags
              ? `
            tokens_by_tag: tokens(where: {tags: {tag: {_in: [${tags.map(
              (tag) => `"${tag}"`
            )}]}}, editions: {_gt: "0"}}, limit: $limit, order_by: { minted_at: desc_nulls_last }) {
              ...baseTokenFields
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
