import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import TokenCollection from '@atoms/token-collection'
import { BaseTokenFieldsFragment } from '@data/api'
import styles from '@style'

function FundFeed({
  minShares = 50,
  introText,
  infoUrl,
  contractAddress,
  cause,
  namepsace,
  tags = null,
}) {
  return (
    <>
      <div className={styles.feed_info}>
        <p>{introText}</p>

        <a href={infoUrl} target="_blank" rel="noreferrer">
          More infos <strong>here</strong>
        </a>
      </div>
      <TokenCollection
        feeds_menu
        label={`Fundraise for ${cause}`}
        namespace={namepsace}
        maxItems={600}
        extractTokensFromResponse={({ tokens_by_share, tokens_by_tag }) => {
          // tokensFromSplitContract
          return orderBy(
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
            created_tokens(where: {editions: {_gt: "0"}, metadata_status: { _eq: "processed" }, teia_meta: { is_signed: { _eq: true }}}, order_by: { minted_at: desc }) {
              ...baseTokenFields
            }
          }
          ${
            tags
              ? `
            tokens_by_tag: tokens(where: {tags: {tag: {_in: [${tags.map(
              (tag) => `"${tag}"`
            )}]}}, editions: {_gt: "0"}, metadata_status: { _eq: "processed" },}, limit: $limit, order_by: { minted_at: desc }) {
              ...baseTokenFields
            }
          `
              : ''
          }
        }
      `}
      />
    </>
  )
}

export default FundFeed
