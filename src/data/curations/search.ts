// Token lookup helpers for the curation editor's token picker.
//
// This is a new type of search that might can be applied to the main search.
// WORK IN PROGRESS

import { request, gql } from 'graphql-request'
import { searchTokensForEmbed } from '@data/api'
import { HEN_CONTRACT_FA2 } from '@constants'
import { HashToURL } from '@utils'

export interface PickerToken {
  fa2_address: string
  token_id: string
  name: string
  display_uri?: string
  thumbnail_uri?: string
  preview_uri?: string
  artist_address?: string
}

export const tokenKey = (t: {
  fa2_address: string
  token_id: string | number
}) => `${t.fa2_address}:${t.token_id}`

function normalizeToken(token: any): PickerToken {
  return {
    fa2_address: token.fa2_address || HEN_CONTRACT_FA2,
    token_id: String(token.token_id),
    name: token.name || `#${token.token_id}`,
    display_uri: token.display_uri || undefined,
    thumbnail_uri: token.thumbnail_uri || undefined,
    preview_uri: token.teia_meta?.preview_uri || undefined,
    artist_address: token.artist_address || undefined,
  }
}

export function pickerThumb(token: {
  preview_uri?: string
  teia_meta?: { preview_uri?: string } | null
  thumbnail_uri?: string
  display_uri?: string
}): string {
  const proxy = import.meta.env.VITE_IMGPROXY
  const preview = token.preview_uri || token.teia_meta?.preview_uri
  if (proxy && preview) return `${proxy}${preview}`
  const uri = token.thumbnail_uri || token.display_uri
  return uri ? HashToURL(uri, 'CDN') : ''
}

export async function searchTokens(query: string): Promise<PickerToken[]> {
  const res = await searchTokensForEmbed(query)
  return (res.tokens || []).map(normalizeToken)
}

export interface PickerArtist {
  user_address: string
  name: string
}

export async function searchTokensAndArtists(
  query: string
): Promise<{ tokens: PickerToken[]; artists: PickerArtist[] }> {
  const res = await searchTokensForEmbed(query)
  return {
    tokens: (res.tokens || []).map(normalizeToken),
    artists: (res.artists || []).map((a: any) => ({
      user_address: a.user_address,
      name: a.name || a.user_address,
    })),
  }
}

const TOKEN_FIELDS = `
  fa2_address
  token_id
  name
  display_uri
  thumbnail_uri
  artist_address
  teia_meta {
    preview_uri
  }
`

const COLLECTED_QUERY = gql`
  query CollectedTokens($address: String!, $limit: Int!) {
    holdings(
      where: {
        holder_address: { _eq: $address }
        token: {
          artist_address: { _neq: $address }
          metadata_status: { _eq: "processed" }
        }
        amount: { _gt: "0" }
      }
      order_by: { last_received_at: desc }
      limit: $limit
    ) {
      token {
        ${TOKEN_FIELDS}
      }
    }
  }
`

/** Tokens collected (held, not minted) by an address. */
export async function fetchCollected(
  address: string,
  limit = 500
): Promise<PickerToken[]> {
  const data = await request(
    import.meta.env.VITE_TEIA_GRAPHQL_API,
    COLLECTED_QUERY,
    { address, limit }
  )
  return (data.holdings || []).map((h: any) => normalizeToken(h.token))
}

const CREATED_QUERY = gql`
  query CreatedTokens($address: String!, $limit: Int!) {
    tokens(
      where: {
        artist_address: { _eq: $address }
        editions: { _gt: "0" }
        metadata_status: { _eq: "processed" }
      }
      order_by: { minted_at: desc }
      limit: $limit
    ) {
      ${TOKEN_FIELDS}
    }
  }
`

/** Tokens minted by an address (their creations). */
export async function fetchCreated(
  address: string,
  limit = 500
): Promise<PickerToken[]> {
  const data = await request(
    import.meta.env.VITE_TEIA_GRAPHQL_API,
    CREATED_QUERY,
    { address, limit }
  )
  return (data.tokens || []).map(normalizeToken)
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&')

function tokenMatch(query: string, withArtist = false) {
  const like = `%${escapeLike(query)}%`
  const conds: Record<string, unknown>[] = [{ name: { _ilike: like } }]
  if (/^\d+$/.test(query)) conds.push({ token_id: { _eq: query } })
  if (withArtist) conds.push({ artist_profile: { name: { _ilike: like } } })
  return conds
}

const SEARCH_CREATED_QUERY = gql`
  query SearchCreated(
    $address: String!
    $match: [tokens_bool_exp!]!
    $limit: Int!
  ) {
    tokens(
      where: {
        artist_address: { _eq: $address }
        editions: { _gt: "0" }
        metadata_status: { _eq: "processed" }
        _or: $match
      }
      order_by: { minted_at: desc }
      limit: $limit
    ) {
      ${TOKEN_FIELDS}
    }
  }
`

const SEARCH_COLLECTED_QUERY = gql`
  query SearchCollected(
    $address: String!
    $match: [tokens_bool_exp!]!
    $limit: Int!
  ) {
    holdings(
      where: {
        holder_address: { _eq: $address }
        amount: { _gt: "0" }
        token: {
          artist_address: { _neq: $address }
          metadata_status: { _eq: "processed" }
          _or: $match
        }
      }
      order_by: { last_received_at: desc }
      limit: $limit
    ) {
      token {
        ${TOKEN_FIELDS}
      }
    }
  }
`

export async function searchCreated(
  address: string,
  query: string,
  limit = 100
): Promise<PickerToken[]> {
  const data = await request(
    import.meta.env.VITE_TEIA_GRAPHQL_API,
    SEARCH_CREATED_QUERY,
    { address, match: tokenMatch(query), limit }
  )
  return (data.tokens || []).map(normalizeToken)
}

export async function searchCollected(
  address: string,
  query: string,
  limit = 100
): Promise<PickerToken[]> {
  const data = await request(
    import.meta.env.VITE_TEIA_GRAPHQL_API,
    SEARCH_COLLECTED_QUERY,
    { address, match: tokenMatch(query, true), limit }
  )
  return (data.holdings || []).map((h: any) => normalizeToken(h.token))
}
