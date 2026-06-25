import { gql } from 'graphql-request'
import { BaseTokenFieldsFragment } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import TokenCollection from '@atoms/token-collection'
import Filters from './filters'

import { useOutletContext } from 'react-router'
import { useSearchParams } from 'react-router-dom'
import { orderBy } from 'lodash'

const FILTER_ALL = 'ALL'
const FILTER_PRIMARY = 'PRIMARY'
const FILTER_SECONDARY = 'SECONDARY'
const FILTER_NOT_FOR_SALE = 'NOT_FOR_SALE'

export default function Creations() {
  const { showRestricted, overrideProtections, address } = useOutletContext()
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
      {/* TODO (xat): do we need that v1 cancel-swap ui here again? */}
      <TokenCollection
        showRestricted={showRestricted}
        overrideProtections={overrideProtections}
        label="Artist's Creations"
        namespace="creations"
        swrParams={[address]}
        variables={{ address }}
        emptyMessage="no creations"
        maxItems={null}
        extractTokensFromResponse={(data, { postProcessTokens }) => {
          const tokens = data.artist_tokens
          const collab_tokens = data.artist_single_collabs
            .map((collab) => {
              if (collab?.split_contract?.created_tokens) {
                if (collab.split_contract.shareholders.length === 1) {
                  return collab?.split_contract?.created_tokens
                }
              }
              return []
            })
            .flat()

          return postProcessTokens(
            orderBy([...tokens, ...collab_tokens], ['minted_at'])
              .reverse()
              .filter((token) => token.mime_type !== 'text/markdown')
              .map((token) => ({ ...token, key: token.token_id }))
          )
        }}
        postProcessTokens={(tokens) => {
          if (filter === FILTER_PRIMARY) {
            return tokens.filter(({ listings }) =>
              listings?.some((l) => l.seller_address === address)
            )
          }

          if (filter === FILTER_SECONDARY) {
            return tokens.filter(({ listings }) =>
              listings?.some((l) => l.seller_address !== address)
            )
          }

          if (filter === FILTER_NOT_FOR_SALE) {
            return tokens.filter(({ listings }) => !listings?.length)
          }

          // all tokens
          return tokens
        }}
        query={gql`
            ${BaseTokenFieldsFragment}
            query creatorGallery($address: String!) {
              artist_tokens: tokens(
                where: {
                  artist_address: { _eq: $address }
                  editions: { _gt: 0 }
                  fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
                  metadata_status: { _eq: "processed" }
                }
                order_by: { minted_at: desc }
              ) {
                ...baseTokenFields
                listings(where: {status: {_eq: "active"}}, order_by: {price: asc}) {
                  seller_address
                }
              }
              artist_single_collabs: teia_shareholders(
                where: { 
                  shareholder_address: { _eq: $address}, 
                  holder_type: { _eq: "core_participant" } 
                }) {
                split_contract{
                  shareholders(where:{holder_type:{_eq:"core_participant"}}) {
                    shareholder_address
                  }
                  created_tokens(where:{editions:{_gt:"0"}, teia_meta:{is_signed:{_eq:true}}}){
                    ...baseTokenFields
                    listings(where: {status: {_eq: "active"}}, order_by: {price: asc}) {
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
