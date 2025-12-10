import { useState } from 'react'
import get from 'lodash/get'
import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import { BaseTokenFieldsFragment } from '@data/api'
import TokenCollection from '@atoms/token-collection'
import { useOutletContext } from 'react-router'
import Checkbox from '@atoms/input/Checkbox'
import styles from '@style'

export default function Collabs() {
  const { /*showFilters,*/ showRestricted, address, overrideProtections } =
    useOutletContext()

  const [hasUnverifiedTokens, setHasUnverifiedTokens] = useState(false)
  const [showUnverified, setShowUnverified] = useState(false)

  return (
    <>
      {hasUnverifiedTokens ? (
        <div className={styles.tools}>
          <Checkbox
            small
            checked={showUnverified}
            onCheck={setShowUnverified}
            label="Include unverified OBJKTs"
          />
        </div>
      ) : null}

      <TokenCollection
        showRestricted={showRestricted}
        overrideProtections={overrideProtections}
        label="Artist's Collabs"
        namespace="collabs"
        swrParams={[address]}
        variables={{ address }}
        emptyMessage="no collabs"
        maxItems={null}
        extractTokensFromResponse={(data) => {
          const tokens = data.teia_shareholders
            .map((shareholder) => {
              return get(shareholder, 'split_contract.created_tokens', [])
            })
            .flat()

          setHasUnverifiedTokens(
            tokens.some((token) => !get(token, 'teia_meta.is_signed'))
          )

          return orderBy(tokens, ['minted_at'])
            .reverse()
            .filter(
              (token) => showUnverified || get(token, 'teia_meta.is_signed')
            )
            .map((token) => ({ ...token, key: token.token_id }))
        }}
        query={gql`
          ${BaseTokenFieldsFragment}
          query GetCollabTokens($address: String!) {
            teia_shareholders(
              where: {
                shareholder_address: { _eq: $address }
                holder_type: { _eq: "core_participant" }
              }
            ) {
              split_contract {
                created_tokens(where: { editions: { _gt: "0" } }) {
                  ...baseTokenFields
                }
              }
            }
          }
        `}
      />
    </>
  )
}
