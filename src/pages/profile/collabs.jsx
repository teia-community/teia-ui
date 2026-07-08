import { useMemo, useState } from 'react'
import useSWR from 'swr'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { gql } from 'graphql-request'
import orderBy from 'lodash/orderBy'
import { BaseTokenFieldsFragment } from '@data/api'
import TokenCollection from '@atoms/token-collection'
import { useOutletContext } from 'react-router'
import { useSearchParams } from 'react-router-dom'
import Checkbox from '@atoms/input/Checkbox'
import { Select } from '@atoms/select'
import { Identicon } from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import Filters from './filters'
import styles from '@style'
import filterStyles from '@components/activity/filters.module.scss'
import layoutStyles from './collabs.module.scss'
import {
  FILTER_ALL,
  FILTER_PRIMARY,
  FILTER_SECONDARY,
  FILTER_NOT_FOR_SALE,
} from '@constants'

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
]

// Switch to a searchable multi-select dropdown instead of chip style.
const COLLAB_DROPDOWN_THRESHOLD = 3

// Flatten the collab tokens out of the shareholders response.
const flattenCollabTokens = (data) =>
  (data?.teia_shareholders || [])
    .map((shareholder) => get(shareholder, 'split_contract.created_tokens', []))
    .flat()

// Remount the feed when the profile changes.
export default function Collabs() {
  const context = useOutletContext()
  return <CollabsFeed key={context.address} {...context} />
}

function CollabsFeed({ showRestricted, address, overrideProtections }) {
  const [showUnverified, setShowUnverified] = useState(false)

  // Collab filter + sort
  const [collabFilter, setCollabFilter] = useState([])
  const [sortMode, setSortMode] = useState('newest')

  const toggleCollab = (addr) =>
    setCollabFilter((prev) =>
      prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr]
    )

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

  // Read the feed's cached response. TokenCollection owns the fetch; sharing its
  // SWR cache by reusing the same key ([namespace, ...swrParams])
  const { data } = useSWR(['collabs', address])

  const hasUnverifiedTokens = flattenCollabTokens(data).some(
    (token) => !get(token, 'teia_meta.is_signed')
  )

  const collabOptions = useMemo(() => {
    const tokens = flattenCollabTokens(data)
    return uniqBy(
      tokens.filter((token) => token.artist_address),
      'artist_address'
    ).map((token) => ({
      address: token.artist_address,
      name:
        get(token, 'artist_profile.name') ||
        walletPreview(token.artist_address),
      logo: get(token, 'artist_profile.metadata.data.identicon'),
    }))
  }, [data])

  const collabSelectOptions = collabOptions.map((c) => ({
    value: c.address,
    label: c.name,
    logo: c.logo,
  }))

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

      <div className={layoutStyles.controls}>
        {collabOptions.length > 1 && (
          <div className={layoutStyles.collabControl}>
            {collabOptions.length > COLLAB_DROPDOWN_THRESHOLD ? (
              <Select
                label="Filter by collab"
                alt="Filter by collab"
                search
                isMulti
                closeMenuOnSelect={false}
                placeholder="All collabs"
                options={collabSelectOptions}
                value={collabSelectOptions.filter((o) =>
                  collabFilter.includes(o.value)
                )}
                onChange={(selected) =>
                  setCollabFilter((selected || []).map((o) => o.value))
                }
                formatOptionLabel={(option, { context }) =>
                  context === 'menu' ? (
                    <span className={layoutStyles.optionRow}>
                      <Identicon
                        address={option.value}
                        logo={option.logo}
                        className={layoutStyles.optionAvatar}
                      />
                      {option.label}
                    </span>
                  ) : (
                    option.label
                  )
                }
              />
            ) : (
              <div
                className={filterStyles.filters}
                style={{ margin: 0, justifyContent: 'flex-start' }}
              >
                <button
                  type="button"
                  className={`${filterStyles.chip} ${
                    collabFilter.length === 0 ? filterStyles.chip_active : ''
                  }`}
                  onClick={() => setCollabFilter([])}
                >
                  All
                </button>
                {collabOptions.map((c) => (
                  <button
                    key={c.address}
                    type="button"
                    className={`${filterStyles.chip} ${
                      collabFilter.includes(c.address)
                        ? filterStyles.chip_active
                        : ''
                    }`}
                    onClick={() => toggleCollab(c.address)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`${filterStyles.filters} ${layoutStyles.sort}`}>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`${filterStyles.chip} ${
                sortMode === s.key ? filterStyles.chip_active : ''
              }`}
              onClick={() => setSortMode(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

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
          return postProcessTokens(
            orderBy(
              flattenCollabTokens(data),
              ['minted_at'],
              [sortMode === 'newest' ? 'desc' : 'asc']
            )
              .filter(
                (token) => showUnverified || get(token, 'teia_meta.is_signed')
              )
              .filter(
                (token) =>
                  collabFilter.length === 0 ||
                  collabFilter.includes(token.artist_address)
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
                  artist_profile {
                    metadata {
                      data
                    }
                  }
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
