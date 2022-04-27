import { rnd } from '../utils'
import {
  MARKETPLACE_CONTRACT_V1,
  HEN_CONTRACT_FA2,
  SUPPORTED_MARKETPLACE_CONTRACTS,
  BURN_ADDRESS,
} from '@constants'
const _ = require('lodash')

export const getDipdupState = `query {
  dipdup_index {
    name
    level
  }
}`

export const getUserMetaQuery = `query UserMeta($address: String = "") {
  holder(where: { address: { _eq: $address } }) {
      name
      metadata
  }
}`

export const getAvailableCollabAddresses = `query GetCollabContracts($address: String!) {
split_contract(where: {administrator: {_eq: $address}}) {
  contract {
    address
    shares {
      shareholder(where: {holder_type: {_eq: "core_participant"}}) {
        holder {
          name
          address
        }
      }
    }
  }
}
}`

export const getCollabCreationsByAddress = `query GetCollabCreations($address: String!) {
token(where: {creator: {is_split: {_eq: true}, address: {_eq: $address}}, supply: {_gt: "0"}}, order_by: {id: desc}) {
  id
  artifact_uri
  display_uri
  thumbnail_uri
  timestamp
  mime
  title
  description
  supply
  token_tags {
    tag {
      tag
    }
  }
}

split_contract(where: {contract_id: {_eq: $address}}) {
  administrator
  shareholder {
    holder {
      address
      name
    }
    holder_type
  }
  contract {
    name
    description
    address
  }
}
}`

export const getCollabCreationsBySubjkt = `query GetCollabCreations($subjkt: String!) {
  token(where: {creator: {is_split: {_eq: true}, name: {_eq: $subjkt}}, supply: {_gt: "0"}}, order_by: {id: desc}) {
    id
    artifact_uri
    display_uri
    thumbnail_uri
    timestamp
    mime
    title
    description
    supply
    token_tags {
      tag {
        tag
      }
    }
  }
  split_contract(where: {contract: {name: {_eq: $subjkt}}}) {
    administrator
    shareholder {
      holder {
        address
        name
      }
      holder_type
    }
    contract {
      name
      description
      address
    }
  }
}`

export const getUserMetadataFile = `
query subjktsQuery($subjkt: String!) {
  holder(where: { name: {_eq: $subjkt}}) {
    metadata_file
  }
}
`

export const getCollabTokensForAddress = `query GetCollabTokens($address: String!) {
shareholder(where: {holder_id: {_eq: $address}, holder_type: {_eq: "core_participant"}}) {
  split_contract {
    contract {
      address
      name
      tokens(where: {supply: {_gt: "0"}}) {
        id
        is_signed
        artifact_uri
        display_uri
        thumbnail_uri
        timestamp
        mime
        title
        description
        supply
        royalties
        creator {
          address
        }
      }
    }
  }
}
}`

export const getCollabTokensForAddressesByShare = `query GetCollabTokens($addresses: [String!]) {
  split_contract(where: {shareholder: {holder_id: {_in: [KT1DWnLiUkNtAQDErXxudFEH63JC6mqg3HEx]}}, contract: {tokens: {supply: {_gt: "0"}, _and: {is_signed: {_eq: true}}}}}) {
    contract {
      address
      name
      shares {
        total_shares
        shareholder {
          holder_id
          shares
        }
      }
      tokens(order_by: {timestamp: desc}) {
        id
        artifact_uri
        display_uri
        thumbnail_uri
        timestamp
        mime
        title
        description
        supply
        royalties
        creator {
          name
          address
        }
      }
    }
  }
}
`

export const getManagedCollabs = `query GetManagedCollabs($address: String!) {
split_contract(where: {administrator: {_eq: $address}}) {
  id
  contract {
    address
    description
    name
  }
  administrator
    shareholder {
      shares
      holder {
        name
        address
      }
    holder_type
  }
}
}`

export const getCollabsForAddress = `query GetCollabs($address: String!) {
split_contract(where: {_or: [{administrator: {_eq: $address}}, {shareholder: {holder_id: {_eq: $address}}}]}) {
  id
  contract {
    address
    description
    name
  }
  administrator
  shareholder {
    shares
    holder {
      name
      address
    }
    holder_type
  }
}
}`

export const getNameForAddress = `query GetNameForAddress($address: String!) {
holder(where: {address: {_eq: $address}}) {
  name
}
}`

const query_objkt = `
query objkt($id: bigint!) {
  token_by_pk(id: $id) {
id
mime
timestamp
display_uri
description
artifact_uri
is_signed
metadata
creator {
  address
  name
  is_split
  shares {
    administrator
    shareholder {
      holder_type
      holder_id
      holder {
        name
        address
      }
    }
  }
}
token_signatures {
  holder_id
}
thumbnail_uri
title
supply
royalties
swaps {
  amount
  amount_left
  id
  opid
  ophash
  price
  timestamp
  creator {
    address
    name
  }
  contract_address
  status
  royalties
  creator_id
  is_valid
}
token_holders(where: {quantity: {_gt: "0"}}) {
  holder_id
  quantity
  holder {
    name
  }
}
token_tags {
  tag {
    tag
  }
}
trades(order_by: {timestamp: asc}) {
  amount
  id
  ophash
  swap {
    price
  }

  seller {
    address
    name
  }
  buyer {
    address
    name
  }
  timestamp
}
}
}
`

const query_v1_swaps = `
query querySwaps($address: String!) {
  swap(where: {contract_address: {_eq: "${MARKETPLACE_CONTRACT_V1}"}, creator_id: {_eq: $address}, status: {_eq: "0"}}) {
    token {
      id
      title
      creator {
        address
      }
      creator_id
    }
    creator {
      address
    }
    creator_id
    amount_left
    price
    id
    token_id
    contract_address
  }
}
`

const query_v2andTeia_swaps = `
query querySwaps($address: String!) {
  swap(where: {token: {creator: {address: {_neq: $address}}}, creator_id: {_eq: $address}, status: {_eq: "0"}, contract_address: { _in : [${SUPPORTED_MARKETPLACE_CONTRACTS.map(
    (contractAddress) => `"${contractAddress}"`
  ).join(', ')}] }}, distinct_on: token_id) {
    creator_id
    token {
      id
      title
      artifact_uri
      display_uri
      mime
      description
      supply
      royalties
      creator {
        name
        address
      }
    }
    contract_address
    amount_left
    price
    id
  }
}
`

export async function fetchUserMetadataFile(subjkt) {
  const { errors, data } = await fetchGraphQL(
    getUserMetadataFile,
    'subjktsQuery',
    { subjkt }
  )

  if (errors) {
    console.error(errors)
  }

  return data.holder
}

export async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(process.env.REACT_APP_TEIA_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
  })

  return await result.json()
}

export async function getObjktsByShare(addresses, min_shares) {
  const { errors, data } = await fetchGraphQL(
    getCollabTokensForAddressesByShare,
    'GetCollabTokens',
    { addresses }
  )

  if (errors) {
    throw errors
  }
  let objkts = []
  const contracts_info = data.split_contract
  for (const i in contracts_info) {
    const contract = contracts_info[i].contract
    const total = contract.shares[0].total_shares
    const tokens = _.filter(
      contract.shares[0].shareholder.map((shareholder) => {
        if (
          addresses.includes(shareholder.holder_id) &&
          (shareholder.shares / total) * 100 >= min_shares
        ) {
          return contract.tokens
        }
        return undefined
      }),
      (tokens) => tokens !== undefined
    )

    objkts = objkts.concat(...tokens)
  }
  return _.orderBy(objkts, ['timestamp'], ['desc'])
}

//- Utility query functions

export async function getLastObjktId() {
  const { data } = await fetchGraphQL(
    `
    query LastId {
      token(limit: 1, order_by: {id: desc}) {
        id
      }
    }`,
    'LastId'
  )
  return data.token[0].id
}

export async function fetchRandomObjkts(count = 10) {
  const firstId = 196
  const lastId = await getLastObjktId()
  const uniqueIds = new Set()
  while (uniqueIds.size < count) {
    uniqueIds.add(rnd(firstId, lastId))
  }
  try {
    let objkts = await fetchObjkts(Array.from(uniqueIds))
    return objkts
  } catch (e) {
    console.error(e)
  }
}

export async function fetchObjkts(ids) {
  const { data } = await fetchGraphQL(
    `
    query Objkts($_in: [bigint!] = "") {
      token(where: { id: {_in: $_in}, supply : { _neq : 0 }}) {
        artifact_uri
        creator_id
        display_uri
        hdao_balance
        id
        mime
        thumbnail_uri
        timestamp
        title
        creator {
          name
          address
        }
      }
    }`,
    'Objkts',
    { _in: ids }
  )
  return data.token
}

async function fetchSubjktNames(addresses) {
  const { errors, data } = await fetchGraphQL(
    `query SubjktNames ($addresses: [String!]) {
    holder(where: {address: {_in: $addresses}}) {
      address
      name
    }
  }
  `,
    'SubjktNames',
    { addresses }
  )
  if (errors) {
    console.error('Failed to fetch SUBJKTs')
    console.error(errors)
  }
  return data.holder
}

export async function fetchObjktDetails(id) {
  const { errors, data } = await fetchGraphQL(query_objkt, 'objkt', { id })
  if (errors) {
    console.error(errors)
  }

  const result = data.token_by_pk

  // Fetch burn transfers
  // we want to use SUBJKT to resolve aliases not tzkt.
  const addressesToResolve = []
  result.transfers = []
  const endpoint = `${process.env.REACT_APP_TZKT_API}/v1/operations/transactions?target.eq=${HEN_CONTRACT_FA2}&parameter.[*].txs.[*].token_id=${data.token_by_pk.id}&parameter.[*].txs.[*].to_=${BURN_ADDRESS}&level.gte=${data.token_by_pk.level}&entrypoint=transfer&status=applied`
  try {
    const burn_operations = await (await fetch(endpoint)).json()
    burn_operations.forEach((item) => {
      if (addressesToResolve.indexOf(item.sender.address) === -1) {
        addressesToResolve.push(item.sender.address)
      }

      result.transfers.push({
        timestamp: item.timestamp,
        ophash: item.hash,
        sender: item.sender.address,
        opid: item.id,
        amount: _(item.parameter.value[0].txs)
          .filter((tx) => tx.to_ === BURN_ADDRESS)
          .sumBy('amount'),
      })
    })
  } catch (error) {
    console.error('Problem with call to tzkt')
    console.error(error)
  }
  const resolvedAddresses = await fetchSubjktNames(addressesToResolve)

  result.transfers.forEach((transfer) => {
    const resolvedAddress = resolvedAddresses.find(
      (subjkt) => subjkt.address === transfer.sender
    )
    transfer.sender = resolvedAddress
  })

  return result
}

/* SWAPS */
export async function fetchV1Swaps(address) {
  const { errors, data } = await fetchGraphQL(query_v1_swaps, 'querySwaps', {
    address: address,
  })
  if (errors) {
    console.error(errors)
  }

  if (!data) {
    return
  }

  const result = data.swap
  // console.log('swapresultv1 ' + JSON.stringify(result))
  return result
}
export async function fetchV2Swaps(address) {
  const { errors, data } = await fetchGraphQL(
    query_v2andTeia_swaps,
    'querySwaps',
    {
      address: address,
    }
  )
  if (errors) {
    console.error(errors)
  }
  const result = data.swap
  // console.log('swapresultv2 ' + JSON.stringify(result))

  return result
}
