import { useState } from 'react'
import { gql } from 'graphql-request'
import { useSearchParams } from 'react-router-dom'
import TokenCollection from '@atoms/token-collection'
import { Checkbox } from '@atoms/input'
import { BaseTokenFieldsFragment } from '@data/api'
import { tagPattern } from '@data/search'
import useSettings from '@hooks/use-settings'
import {
  HEN_CONTRACT_FA2,
  METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS,
  METADATA_CONTENT_RATING_MATURE,
} from '@constants'
import artistStyles from '@pages/artists/index.module.scss'
import homeStyles from '@pages/home/index.module.scss'

/**
 * TagFeed's query plus the search page filters (`filters` is a
 * tokens_bool_exp, as built by the artists page's toBoolExp). Photosensitive
 * and NSFW tokens are hidden unless opted in, as on the artists page.
 */
export function SearchFeed({ filters = {} }) {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''
  const [showPhotosensitive, setShowPhotosensitive] = useState(false)
  const [showNsfw, setShowNsfw] = useState(false)
  const { photosensitiveMap, nsfwMap } = useSettings()

  const isPhotosensitive = (token) =>
    photosensitiveMap?.get(token.token_id) === 1 ||
    token.teia_meta?.accessibility?.hazards?.includes(
      METADATA_ACCESSIBILITY_HAZARDS_PHOTOSENS
    )
  const isNsfw = (token) =>
    nsfwMap?.get(token.token_id) === 1 ||
    token.teia_meta?.content_rating === METADATA_CONTENT_RATING_MATURE

  return (
    <>
      <div className={artistStyles.page}>
        <div className={artistStyles.toggles}>
          <div data-tour="hazards" className={homeStyles.hazard_group}>
            <Checkbox
              checked={showPhotosensitive}
              onCheck={setShowPhotosensitive}
              label="Show photosensitive creations"
            />
            <Checkbox
              checked={showNsfw}
              onCheck={setShowNsfw}
              label="Show NSFW creations"
            />
          </div>
        </div>
      </div>
      <TokenCollection
        feeds_menu={false}
        label="Search"
        namespace="search-feed"
        variables={{ tag: tagPattern(searchTerm), filters }}
        swrParams={[searchTerm, JSON.stringify(filters)]}
        maxItems={600}
        paginate
        postProcessTokens={(tokens) =>
          tokens.filter(
            (token) =>
              (showPhotosensitive || !isPhotosensitive(token)) &&
              (showNsfw || !isNsfw(token))
          )
        }
        query={gql`
        ${BaseTokenFieldsFragment}
        query getObjktsByTag(
          $tag: String!
          $limit: Int!
          $offset: Int = 0
          $filters: tokens_bool_exp!
        ) {
          tokens(
            where: {
              tags: { tag: { _ilike: $tag } },
              editions: { _neq: 0 },
              fa2_address: { _eq: "${HEN_CONTRACT_FA2}" },
              metadata_status: { _eq: "processed" },
              _and: [$filters]
            }
            order_by: { minted_at: desc }
            limit: $limit
            offset: $offset
          ) {
            ...baseTokenFields
          }
        }
      `}
      />
    </>
  )
}

export default SearchFeed
