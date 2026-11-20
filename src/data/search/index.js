import useSWR from 'swr'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { gql, request } from 'graphql-request'
import { HEN_CONTRACT_FA2 } from '@constants'
import { fetchGraphQL } from '@data/api'
import laggy from '@utils/swr-laggy-middleware'

const SWR_OPTIONS = { revalidateIfStale: false, revalidateOnFocus: false }

/**
 * Users whose name contains `term`. Shared by the Users tab and its count,
 * so both read one request from the SWR cache.
 */
export function useUserSearch(term) {
  const { data, isLagging } = useSWR(
    term ? ['subjkts-search', term] : null,
    async (ns, term) => {
      const result = await fetchGraphQL(
        gql`
          query getSubjkts($subjkt: String!) {
            teia_users(where: { name: { _ilike: $subjkt } }) {
              user_address
              name
              metadata {
                data
              }
            }
          }
        `,
        'getSubjkts',
        {
          subjkt: `%${term}%`,
        }
      )

      return uniqBy(
        get(result.data, 'teia_users') || [],
        ({ name }) => name
      ).filter(({ name }) => name)
    },
    { ...SWR_OPTIONS, use: [laggy] }
  )

  return { users: data, isLagging }
}

/** Case-insensitive exact tag match for `_ilike`: escape LIKE wildcards. */
export const tagPattern = (term) => term.replace(/[\\%_]/g, '\\$&')

// Same filter as the OBJKTs tab (TagFeed).
const OBJKT_COUNT_QUERY = gql`
  query objktCount($tag: String!, $filters: tokens_bool_exp!) {
    tokens_aggregate(
      where: {
        tags: { tag: { _ilike: $tag } }
        editions: { _neq: 0 }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
        metadata_status: { _eq: "processed" }
        _and: [$filters]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`

// Same filter as useArtistsPage, counted per distinct artist.
const ARTIST_COUNT_QUERY = gql`
  query artistCount($search: String!, $filters: tokens_bool_exp!) {
    tokens_aggregate(
      where: {
        artist_address: { _like: "tz%" }
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
        artist_profile: { name: { _ilike: $search } }
        _and: [$filters]
      }
    ) {
      aggregate {
        count(columns: artist_address, distinct: true)
      }
    }
  }
`

function useCount(name, query, variables) {
  const { data } = useSWR(
    variables ? [name, JSON.stringify(variables)] : null,
    async () => {
      const res = await request(
        import.meta.env.VITE_TEIA_GRAPHQL_API,
        query,
        variables
      )
      return res.tokens_aggregate.aggregate.count
    },
    SWR_OPTIONS
  )
  return data
}

/** `filters` is a tokens_bool_exp, as built by the artists page's toBoolExp. */
export const useObjktCount = (term, filters = {}) =>
  useCount(
    'search-objkt-count',
    OBJKT_COUNT_QUERY,
    term && { tag: tagPattern(term), filters }
  )

export const useArtistCount = (term, filters = {}) =>
  useCount(
    'search-artist-count',
    ARTIST_COUNT_QUERY,
    term && { search: `%${term}%`, filters }
  )

/** Client-side match until the events API supports search. */
export function filterEvents(events, term) {
  const needle = term.toLowerCase()
  return events.filter((event) =>
    [event.title, event.subtitle, event.description].some((field) =>
      field?.toLowerCase().includes(needle)
    )
  )
}
