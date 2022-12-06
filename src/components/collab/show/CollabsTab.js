import { useState } from 'react'
import get from 'lodash/get'
import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import { BaseTokenFieldsFragment } from '../../../data/api'
import { Container } from '../../layout'
import TokenCollection from '../../../components/token-collection'
import collabStyles from '../styles.module.scss'
import classNames from 'classnames'

export const CollabsTab = ({ wallet }) => {
  const [hasUnverifiedTokens, setHasUnverifiedTokens] = useState(false)
  const [showUnverified, setShowUnverified] = useState(false)
  const toolbarStyles = classNames(collabStyles.flex, collabStyles.mb2)

  return (
    <Container xlarge>
      {hasUnverifiedTokens ? (
        <div className={toolbarStyles}>
          <label>
            <input
              type="checkbox"
              onChange={() => setShowUnverified(!showUnverified)}
              checked={showUnverified}
            />
            include unverified OBJKTs
          </label>
        </div>
      ) : null}

      <TokenCollection
        defaultViewMode="masonry"
        namespace="collabs"
        swrParams={[wallet]}
        variables={{ address: wallet }}
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
    </Container>
  )
}
