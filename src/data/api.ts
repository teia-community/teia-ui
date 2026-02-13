import {
  HEN_CONTRACT_FA2,
  DAO_TOKEN_DECIMALS,
  CLAIMED_DAO_TOKENS_BIGMAP_ID,
} from '@constants'
import axios from 'axios'

export const BaseTokenFieldsFragment = `
fragment baseTokenFields on tokens {
  artifact_uri
  display_uri
  thumbnail_uri
  metadata_uri

  artist_address
  artist_profile {
    name
    is_split
  }
  description
  editions
  fa2_address
  listings(where: {status: {_eq: "active"}}, order_by: {price: asc}) {
    amount
    amount_left
    contract_address
    price
    status
    type
  }
  mime_type
  minted_at
  metadata_status
  name
  price
  
  royalties
  royalties_total
 
  royalty_receivers {
    receiver_address
    royalties
  }
  teia_meta {
    accessibility
    content_rating
    is_signed
    preview_uri
  }

  tags {
    tag
  }
  
  token_id
}
`

export async function fetchGraphQL(
  operationsDoc: string,
  operationName: string,
  variables: { [key: string]: any }
) {
  const result = await fetch(import.meta.env.VITE_TEIA_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables,
      operationName,
    }),
  })

  return await result.json()
}

export const getCollabsForAddress = `query GetCollabs($address: String!) {
  split_contracts: teia_split_contracts(where: {_or: [{administrator_address: {_eq: $address}}, {shareholders: {shareholder_address: {_eq: $address}}}]}) {
    contract_address
    contract_profile {
      name
      metadata {
        data
      }
    }
    administrator_address
    shareholders {
      shareholder_address
      shareholder_profile {
        name
      }
      shares
      holder_type
    }
  }
}`

export const getNameForAddress = `query GetNameForAddress($address: String!) {
  teia_users(where: {user_address: {_eq: $address}}) {
    name
  }
}`

// TODO: add all supported event types
const query_objkt = `
${BaseTokenFieldsFragment}
query objkt($id: String!) {
  tokens_by_pk(fa2_address: "${HEN_CONTRACT_FA2}", token_id: $id) {
    ...baseTokenFields
    artist_profile {
      name
      is_split
      split_contract {
        administrator_address
        shareholders {
          shareholder_address
          shareholder_profile {
            user_address
            name
          }
          holder_type
          shares
        }
      }
    }
    signatures {
      shareholder_address
    }
    rights
    right_uri
    listings(where: {status: {_eq: "active"}}, order_by: {price: asc}) {
      type
      contract_address
      amount
      amount_left
      swap_id
      ask_id
      offer_id
      price
      start_price
      end_price
      seller_address
      seller_profile {
        name
      }
      status
    }
    holdings(where: {amount: {_gt: "0"}}) {
      holder_address
      amount
      holder_profile {
        name
      }
    }
    tags {
      tag
    }
    events(where: { _or: [{ implements: {_eq: "SALE"} }, { type: {_in: ["HEN_MINT", "TEIA_SWAP", "HEN_SWAP", "HEN_SWAP_V2", "VERSUM_SWAP", "FA2_TRANSFER", "OBJKT_ASK", "OBJKT_ASK_V2", "OBJKT_ASK_V3", "OBJKT_ASK_V3_PRE", "OBJKT_ASK_V3_2"]} }]}, order_by: [{level: desc}, {opid: desc}]) {
      timestamp
      implements
      ophash
      id
      type
      price
      amount
      editions
      seller_address
      seller_profile {
        name
      }
      buyer_address
      buyer_profile {
        name
      }
      from_address
      from_profile {
        name
      }
      to_address
      to_profile {
        name
      }
    }
  }
}
`

export async function getUser(addressOrName: string, type = 'user_address') {
  const { data } = await fetchGraphQL(
    `
  query addressQuery($addressOrName: String!) {
    teia_users(where: { ${type}: {_eq: $addressOrName}}) {
      user_address
      name
      metadata {
        data
      }
    }
  }
  `,
    'addressQuery',
    {
      addressOrName,
    }
  )

  return data?.teia_users?.length ? data.teia_users[0] : null
}

export async function fetchCollabCreations(
  addressOrSubjkt: string,
  type = 'address'
) {
  const { data } = await fetchGraphQL(
    `
    ${BaseTokenFieldsFragment}
    query GetCollabCreations($addressOrSubjkt: String!) {
      tokens(where: {${
        type === 'address'
          ? `artist_address: {_eq: $addressOrSubjkt}`
          : `artist_profile: {name: {_eq: $addressOrSubjkt }}`
      }, editions: {_gt: "0"}}, order_by: {token_id: desc}) {
        ...baseTokenFields
        tags {
          tag
        }
      }
      split_contracts: teia_split_contracts(where: {${
        type === 'address'
          ? `contract_address: {_eq: $addressOrSubjkt}`
          : `contract_profile: {name: {_eq: $addressOrSubjkt}}`
      }}) {
        administrator_address
        shareholders {
          shareholder_address
          shareholder_profile {
            name
          }
          holder_type
        }
        contract_address
        contract_profile {
          name
          metadata {
            data
          }
        }
      }
    }`,
    'GetCollabCreations',
    { addressOrSubjkt }
  )

  return data
}

export async function fetchObjktDetails(id: string) {
  const { data } = await fetchGraphQL(query_objkt, 'objkt', {
    id,
  })
  return data.tokens_by_pk
}

interface TzktMetadata {
  twitter?: string
  alias?: string
}

interface TzktData {
  data?: TzktMetadata
}

/**
 * Get User Metadata
 */
export const GetUserMetadata = async (walletAddr: string) => {
  const tzktData: TzktData = await getTzktData(
    `/v1/accounts/${walletAddr}`
  )

  return tzktData
}

/**
 * Get some data from the TzKT API
 */
export async function getTzktData(
  query: string,
  parameters = {},
  debug = false
) {
  const url = import.meta.env.VITE_TZKT_API + query
  const response = await axios
    .get(url, { params: parameters })
    .catch((error) =>
      console.log(`The following TzKT query returned an error: ${url}`, error)
    )

  if (debug) console.log(`Executed TzKT query: ${url}`)

  return response?.data
}

/**
 * Search tokens for embedding in blog posts.
 * Auto-detects query type: token ID, tezos address, or text search.
 */
export async function searchTokensForEmbed(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return { tokens: [], artists: [] }

  // Token ID lookup
  if (/^\d+$/.test(trimmed)) {
    const token = await fetchObjktDetails(trimmed)
    return { tokens: token ? [token] : [], artists: [] }
  }

  // Address lookup
  if (/^(tz[123]|KT1)/.test(trimmed)) {
    const { data } = await fetchGraphQL(
      `${BaseTokenFieldsFragment}
      query SearchByAddress($address: String!) {
        tokens(
          where: {
            artist_address: { _eq: $address },
            fa2_address: { _eq: "${HEN_CONTRACT_FA2}" },
            editions: { _gt: "0" }
          },
          order_by: { minted_at: desc },
          limit: 20
        ) {
          ...baseTokenFields
        }
      }`,
      'SearchByAddress',
      { address: trimmed }
    )
    return { tokens: data?.tokens || [], artists: [] }
  }

  // Text search: tokens by name + users by name
  const { data } = await fetchGraphQL(
    `${BaseTokenFieldsFragment}
    query SearchTokensAndArtists($query: String!) {
      tokens(
        where: {
          name: { _ilike: $query },
          fa2_address: { _eq: "${HEN_CONTRACT_FA2}" },
          editions: { _gt: "0" }
        },
        order_by: { minted_at: desc },
        limit: 10
      ) {
        ...baseTokenFields
      }
      teia_users(
        where: { name: { _ilike: $query } },
        limit: 5
      ) {
        user_address
        name
      }
    }`,
    'SearchTokensAndArtists',
    { query: `%${trimmed}%` }
  )

  return {
    tokens: data?.tokens || [],
    artists: data?.teia_users || [],
  }
}

/**
 * Get user claimed tokens
 */
export async function getClaimedDaoTokens(walletAddr: string) {
  const data = await getTzktData(
    `/v1/bigmaps/${CLAIMED_DAO_TOKENS_BIGMAP_ID}/keys/${walletAddr}`
  )

  return data?.value ? parseInt(data.value) / DAO_TOKEN_DECIMALS : 0
}
