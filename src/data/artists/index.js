import useSWR from 'swr'
import axios from 'axios'
import { gql, request } from 'graphql-request'
import { DAO_TOKEN_DECIMALS, HEN_CONTRACT_FA2 } from '@constants'
import { getTzktData } from '@data/api'
import laggy from '@utils/swr-laggy-middleware'
import { fetchAccountsTokenBalances } from '@data/roles'

const ARTISTS_PAGE_SIZE = 50
const ARTIST_PREVIEW_COUNT = 10
const ARTISTS_TOKEN_BATCH = 500
// Hasura rejects null in `_lt`, so the first page starts from the far future.
const ARTISTS_FIRST_CURSOR = '9999-01-01T00:00:00Z'

// Only these load as <img> previews. Animated GIFs come back from imgproxy as
// multi-MB animated webp; other types render as a labelled tile instead.
export const ARTIST_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]

const ARTISTS_PAGE_QUERY = gql`
  query ArtistsPage(
    $before: timestamptz!
    $exclude: [String!]!
    $limit: Int!
    $search: String!
    $filters: tokens_bool_exp!
  ) {
    tokens(
      order_by: { minted_at: desc }
      where: {
        minted_at: { _lt: $before }
        artist_address: { _like: "tz%", _nin: $exclude }
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
        artist_profile: { name: { _ilike: $search } }
        _and: [$filters]
      }
      limit: $limit
    ) {
      artist_address
      minted_at
      artist_profile {
        name
        metadata {
          data
        }
      }
    }
  }
`

// One request, one aliased sub-query per artist, so each artist gets its own
// `limit` (Hasura has no per-group limit on an `_in` filter).
function buildArtistPreviewsQuery(addresses) {
  const fields = addresses
    .map(
      (address, i) => `
      a${i}: tokens(
        where: {
          artist_address: { _eq: "${address}" }
          editions: { _gt: 0 }
          metadata_status: { _eq: "processed" }
          fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
          _and: [$filters]
        }
        order_by: { minted_at: desc }
        limit: ${ARTIST_PREVIEW_COUNT}
      ) {
        token_id
        name
        display_uri
        artifact_uri
        mime_type
        formats
        listings(where: { status: { _eq: "active" } }) {
          seller_address
        }
        teia_meta {
          preview_uri
          accessibility
          content_rating
        }
      }`
    )
    .join('\n')
  return `query ArtistPreviews($filters: tokens_bool_exp!) { ${fields} }`
}

/**
 * Artists directory page, most recently minting artists first. Walks tokens
 * newest-first (500 per request), collecting the first 50 distinct artists
 * not in `exclude` (artists shown on earlier pages). Returns a `cursor`
 * (minted_at of the last token consumed) for the next page. `search` is an
 * ilike substring on the artist name; `filters` is a tokens_bool_exp applied
 * to both the page and preview queries. Typically two GraphQL requests per page.
 */
export function useArtistsPage(before, exclude, search = '', filters = {}) {
  return useSWR(
    ['artists-page', before, exclude, search, JSON.stringify(filters)],
    async () => {
      const artists = []
      const seen = new Set(exclude)
      let cursor = before ?? ARTISTS_FIRST_CURSOR
      let exhausted = false

      while (artists.length < ARTISTS_PAGE_SIZE && !exhausted) {
        const { tokens } = await request(
          import.meta.env.VITE_TEIA_GRAPHQL_API,
          ARTISTS_PAGE_QUERY,
          {
            before: cursor,
            exclude,
            limit: ARTISTS_TOKEN_BATCH,
            search: `%${search}%`,
            filters,
          }
        )
        exhausted = tokens.length < ARTISTS_TOKEN_BATCH
        for (const t of tokens) {
          if (seen.has(t.artist_address)) continue
          seen.add(t.artist_address)
          artists.push({
            address: t.artist_address,
            name: t.artist_profile.name,
            description: t.artist_profile.metadata?.data?.description,
            identicon: t.artist_profile.metadata?.data?.identicon,
            card: t.artist_profile.metadata?.data?.card,
          })
          cursor = t.minted_at
          if (artists.length === ARTISTS_PAGE_SIZE) break
        }
        // Batch consumed without filling the page: skip past all of it.
        if (artists.length < ARTISTS_PAGE_SIZE && tokens.length) {
          cursor = tokens[tokens.length - 1].minted_at
        }
      }

      if (!artists.length) return { artists: [], cursor: null, hasMore: false }

      const previews = await request(
        import.meta.env.VITE_TEIA_GRAPHQL_API,
        buildArtistPreviewsQuery(artists.map((a) => a.address)),
        { filters }
      )
      artists.forEach((a, i) => {
        a.tokens = previews[`a${i}`] ?? []
      })

      return { artists, cursor, hasMore: !exhausted }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )
}

/**
 * Previews for a single artist (configure page). Same query as the list.
 */
export function useArtistPreviews(address) {
  return useSWR(address ? ['artist-previews', address] : null, async () => {
    const res = await request(
      import.meta.env.VITE_TEIA_GRAPHQL_API,
      buildArtistPreviewsQuery([address]),
      { filters: {} }
    )
    return res.a0 ?? []
  })
}

/**
 * Batched per-page profile extras for artist cards: Tezos domain, TzKT alias
 * and social handles, baker, first activity, and TEIA balance. Three requests
 * for up to 50 addresses. Returns { [address]: extras }.
 *
 * TzKT's list endpoint (`address.in`) returns `extras: null`, so social
 * handles (twitter, discord, github) only come back with `deep`, which costs
 * one `/v1/accounts/{address}` request per address. The directory page stays
 * batched; the configure page (one artist) uses `deep`.
 * TODO: nice to have socials on the directory cards without 50 requests/page.
 */
export function useArtistExtras(addresses, deep = false) {
  const key = addresses.length
    ? ['artist-extras', addresses.join(','), deep]
    : null
  return useSWR(key, async () => {
    const out = Object.fromEntries(addresses.map((a) => [a, {}]))
    // Each source fails soft: one API being down must not blank the others.
    const soft = (p, fallback) => p.catch(() => fallback)
    const [domains, accounts, balances] = await Promise.all([
      soft(
        axios
          .post(import.meta.env.VITE_TEZOSDOMAINS_GRAPHQL_API, {
            query: `query($a: [Address!]) { reverseRecords(where: { address: { in: $a } }) { items { address domain { name data { key value } } } } }`,
            variables: { a: addresses },
          })
          .then((r) => r.data?.data?.reverseRecords?.items ?? []),
        []
      ),
      deep
        ? Promise.all(
            addresses.map((a) => soft(getTzktData(`/v1/accounts/${a}`), null))
          )
        : soft(
            getTzktData('/v1/accounts', {
              'address.in': addresses.join(','),
              limit: addresses.length,
            }),
            []
          ),
      soft(fetchAccountsTokenBalances(addresses), new Map()),
    ])
    for (const d of domains) {
      out[d.address].domain = d.domain?.name
      // Website set on the Tezos domain. On-chain and user-controlled, so
      // only http(s) is allowed through to an href.
      const site = d.domain?.data?.find(
        (r) => r.key === 'web:redirect_url'
      )?.value
      if (typeof site === 'string' && /^https?:\/\//i.test(site))
        out[d.address].website = site
    }
    for (const a of accounts ?? []) {
      if (!a?.address) continue
      const p = a.extras?.profile ?? {}
      Object.assign(out[a.address], {
        alias: a.alias,
        twitter: p.twitter,
        discord: p.discord,
        github: p.github,
        baker: a.delegate?.alias || a.delegate?.address,
        since: a.firstActivityTime,
      })
    }
    for (const [addr, bal] of balances)
      out[addr].teia = bal / DAO_TOKEN_DECIMALS
    return out
  })
}
