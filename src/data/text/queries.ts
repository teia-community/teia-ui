// GraphQL documents for Teia Text (the blog). Every feed lists text/plain and
// text/markdown OBJKTs on the HEN contract; they differ only in whose posts.

import { gql } from 'graphql-request'
import { HEN_CONTRACT_FA2 } from '@constants'
import { BaseTokenFieldsFragment } from '@data/api'

/** Community: the latest posts from anyone. */
export const TEXT_POSTS_QUERY = gql`
  ${BaseTokenFieldsFragment}
  query TextPosts($limit: Int!) {
    tokens(
      where: {
        _or: [
          { mime_type: { _eq: "text/plain" } }
          { mime_type: { _eq: "text/markdown" } }
        ]
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
      }
      order_by: { minted_at: desc }
      limit: $limit
    ) {
      ...baseTokenFields
    }
  }
`

/** One author's posts, with the holdings/listings the burn controls need. */
export const TEXT_POSTS_BY_ARTIST_QUERY = gql`
  ${BaseTokenFieldsFragment}
  query TextPostsByArtist($address: String!) {
    tokens(
      where: {
        artist_address: { _eq: $address }
        _or: [
          { mime_type: { _eq: "text/plain" } }
          { mime_type: { _eq: "text/markdown" } }
        ]
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
      }
      order_by: { minted_at: desc }
    ) {
      ...baseTokenFields
      listings(where: { status: { _eq: "active" } }, order_by: { price: asc }) {
        seller_address
      }
      holdings(where: { amount: { _gt: "0" } }) {
        holder_address
        amount
      }
    }
  }
`

/** Bulletin: tagged posts from multisig members and moderators. */
export const OFFICIAL_TEXT_POSTS_QUERY = gql`
  ${BaseTokenFieldsFragment}
  query OfficialTextPosts($addresses: [String!], $tag: String!, $limit: Int!) {
    tokens(
      where: {
        artist_address: { _in: $addresses }
        tags: { tag: { _eq: $tag } }
        _or: [
          { mime_type: { _eq: "text/plain" } }
          { mime_type: { _eq: "text/markdown" } }
        ]
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
      }
      order_by: { minted_at: desc }
      limit: $limit
    ) {
      ...baseTokenFields
    }
  }
`

/** TEIA Members: posts from current TEIA token holders. */
export const HOLDER_TEXT_POSTS_QUERY = gql`
  ${BaseTokenFieldsFragment}
  query HolderTextPosts($addresses: [String!], $limit: Int!) {
    tokens(
      where: {
        artist_address: { _in: $addresses }
        _or: [
          { mime_type: { _eq: "text/plain" } }
          { mime_type: { _eq: "text/markdown" } }
        ]
        editions: { _gt: 0 }
        metadata_status: { _eq: "processed" }
        fa2_address: { _eq: "${HEN_CONTRACT_FA2}" }
      }
      order_by: { minted_at: desc }
      limit: $limit
    ) {
      ...baseTokenFields
    }
  }
`
