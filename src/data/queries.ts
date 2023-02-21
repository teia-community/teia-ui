import { gql } from 'graphql-request'

//- fragments
export const BaseTokenFieldsFragment = gql`
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
    listings(where: { status: { _eq: "active" } }, order_by: { price: asc }) {
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
    token_id
  }
`

//- Tokens
export const objkt = gql`
  ${BaseTokenFieldsFragment}
  query objkt($id: String!) {
    tokens_by_pk(
      fa2_address: "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton"
      token_id: $id
    ) {
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
      listings(where: { status: { _eq: "active" } }, order_by: { price: asc }) {
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
      holdings(where: { amount: { _gt: "0" } }) {
        holder_address
        amount
        holder_profile {
          name
        }
      }
      tags {
        tag
      }
      events(
        where: {
          _or: [
            { implements: { _eq: "SALE" } }
            {
              type: {
                _in: [
                  "HEN_MINT"
                  "TEIA_SWAP"
                  "HEN_SWAP"
                  "HEN_SWAP_V2"
                  "VERSUM_SWAP"
                  "FA2_TRANSFER"
                ]
              }
            }
          ]
        }
        order_by: [{ level: desc }, { opid: desc }]
      ) {
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

//- Double Mint
export const uriMintedByAddress = gql`
  query uriMintedByAddress($address: String!, $uris: [String!] = "") {
    tokens(
      order_by: { minted_at: desc }
      where: {
        metadata_status: { _eq: "processed" }
        artifact_uri: { _in: $uris }
        artist_address: { _eq: $address }
      }
    ) {
      token_id
      editions
    }
  }
`

//- Collabs
export const getCollabsForAddress = gql`
  query getCollabsForAddress($address: String!) {
    split_contracts: teia_split_contracts(
      where: {
        _or: [
          { administrator_address: { _eq: $address } }
          { shareholders: { shareholder_address: { _eq: $address } } }
        ]
      }
    ) {
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
  }
`
// collab Creations
export const collabCreationsFragment = gql`
  fragment collabCreationsTokens on tokens {
    ${BaseTokenFieldsFragment}
    ...baseTokenFields
    tags{
        tag
    }
  }
  fragment collabCreationsSplit on teia_split_contracts {
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
`
export const collabCreationsFromAddress = gql`
  ${collabCreationsFragment}
  query collabCreationsFromAddress($addressOrSubjkt: String!) {
    tokens(
      where: {
        artist_address: { _eq: $addressOrSubjkt }
        editions: { _gt: "0" }
      }
      order_by: { token_id: desc }
    ) {
      ...collabCreationsTokens
    }
    split_contracts: teia_split_contracts(
      where: { contract_address: { _eq: $addressOrSubjkt } }
    ) {
      ...collabCreationsSplit
    }
  }
`
export const collabCreationsFromName = gql`
  ${collabCreationsFragment}
  query collabCreationsFromName($addressOrSubjkt: String!) {
    tokens(
      where: {
        artist_profile: { name: { _eq: $addressOrSubjkt } }
        editions: { _gt: "0" }
      }
      order_by: { token_id: desc }
    ) {
      ...collabCreationsTokens
    }
    split_contracts: teia_split_contracts(
      where: { contract_profile: { name: { _eq: $addressOrSubjkt } } }
    ) {
      ...collabCreationsSplit
    }
  }
`

// user
export const userFragment = gql`
  fragment userFragment on teia_users {
    user_address
    name
    metadata {
      data
    }
  }
`

export const userByName = gql`
  query userByName($addressOrSubjkt: String!) {
    teia_users(where: { name: { _eq: $addressOrSubjkt } }) {
      ${userFragment}
      ...userFragment
    }
  }
`
export const userByAddress = gql`
  query userByAddress($addressOrSubjkt: String!) {
    teia_users(where: { user_address: { _eq: $addressOrSubjkt } }) {
        ${userFragment}
      ...userFragment
    }
  }
`
