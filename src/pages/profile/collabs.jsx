import { useState } from 'react'
import get from 'lodash/get'
import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import { BaseTokenFieldsFragment } from '@data/api'
import TokenCollection from '@atoms/token-collection'
import { useOutletContext } from 'react-router'
import { useSearchParams } from 'react-router-dom'
import Checkbox from '@atoms/input/Checkbox'
import Filters from './filters'
import styles from '@style'
import {
  FILTER_ALL,
  FILTER_PRIMARY,
  FILTER_SECONDARY,
  FILTER_NOT_FOR_SALE,
} from '@constants'

export default function Collabs() {
  const { showRestricted, address, overrideProtections } = useOutletContext()

  const [hasUnverifiedTokens, setHasUnverifiedTokens] = useState(false)
  const [showUnverified, setShowUnverified] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('filter') || FILTER_ALL

  const setFilter = (value) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        value === FILTER_ALL ? next.delete('filter') : next.set('filter', value)
        return next
      },
      { preventScrollReset: true }
    )

  return (
    <>
      <Filters
        filter={filter}
        onChange={setFilter}
        items={[
          { type: FILTER_ALL, label: 'All' },
          { type: FILTER_PRIMARY, label: 'Primary' },
          { type: FILTER_SECONDARY, label: 'Secondary' },
          { type: FILTER_NOT_FOR_SALE, label: 'Not for sale' },
        ]}
      />

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
        postProcessTokens={(tokens) => {
          if (filter === FILTER_NOT_FOR_SALE) {
            return tokens.filter(({ listings }) => !listings?.length)
          }

          if (filter === FILTER_PRIMARY) {
            return tokens.filter(({ listings, artist_address }) =>
              listings?.some((l) => l.seller_address === artist_address)
            )
          }

          if (filter === FILTER_SECONDARY) {
            return tokens.filter(({ listings, artist_address }) =>
              listings?.some((l) => l.seller_address !== artist_address)
            )
          }

          return tokens
        }}
        extractTokensFromResponse={(data, { postProcessTokens }) => {
          const tokens = data.teia_shareholders
            .map((shareholder) => {
              return get(shareholder, 'split_contract.created_tokens', [])
            })
            .flat()

          setHasUnverifiedTokens(
            tokens.some((token) => !get(token, 'teia_meta.is_signed'))
          )

          return postProcessTokens(
            orderBy(tokens, ['minted_at'])
              .reverse()
              .filter(
                (token) => showUnverified || get(token, 'teia_meta.is_signed')
              )
              .map((token) => ({ ...token, key: token.token_id }))
          )
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
                  listings(
                    where: { status: { _eq: "active" } }
                    order_by: { price: asc }
                  ) {
                    seller_address
                  }
                }
              }
            }
          }
        `}
      />
    </>
  )
}
