import { rnd } from '../utils'
const _ = require('lodash')

export const getDipdupState = `query {
  hic_et_nunc_dipdup_state {
    hash
    index_hash
    index_name
    index_type
    level
  }
}`

export const getUserMetaQuery = `query UserMeta($address: String = "") {
  hic_et_nunc_holder(where: { address: { _eq: $address } }) {
      name
      metadata
  }
}`

export const getAvailableCollabAddresses = `query GetCollabContracts($address: String!) {
hic_et_nunc_splitcontract(where: {administrator: {_eq: $address}}) {
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
hic_et_nunc_token(where: {creator: {is_split: {_eq: true}, address: {_eq: $address}}, supply: {_gt: "0"}}, order_by: {id: desc}) {
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

hic_et_nunc_splitcontract(where: {contract_id: {_eq: $address}}) {
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
  hic_et_nunc_token(where: {creator: {is_split: {_eq: true}, name: {_eq: $subjkt}}, supply: {_gt: "0"}}, order_by: {id: desc}) {
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
  hic_et_nunc_splitcontract(where: {contract: {name: {_eq: $subjkt}}}) {
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
  hic_et_nunc_holder(where: { name: {_eq: $subjkt}}) {
    metadata_file
  }
}
`

export const getCollabTokensForAddress = `query GetCollabTokens($address: String!) {
hic_et_nunc_shareholder(where: {holder_id: {_eq: $address}, holder_type: {_eq: "core_participant"}}) {
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
  hic_et_nunc_splitcontract(where: {shareholder: {holder_id: {_in: $addresses}}, contract: {tokens: {supply: {_gt: "0"}, _and: {is_signed: {_eq: true}}}}}) {
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
hic_et_nunc_splitcontract(where: {administrator: {_eq: $address}}) {
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
hic_et_nunc_splitcontract(where: {_or: [{administrator: {_eq: $address}}, {shareholder: {holder_id: {_eq: $address}}}]}) {
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
hic_et_nunc_holder(where: {address: {_eq: $address}}) {
  name
}
}`

export async function fetchUserMetadataFile(subjkt) {
  const { errors, data } = await fetchGraphQL(
    getUserMetadataFile,
    'subjktsQuery',
    { subjkt }
  )

  if (errors) {
    console.error(errors)
  }

  return data.hic_et_nunc_holder
}

export async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(process.env.REACT_APP_GRAPHQL_API, {
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
  const contracts_info = data.hic_et_nunc_splitcontract
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
      hic_et_nunc_token(limit: 1, order_by: {id: desc}) {
        id
      }
    }`,
    'LastId'
  )
  return data.hic_et_nunc_token[0].id
}

export async function fetchRandomObjkts(count) {
  const firstId = 196
  const lastId = await getLastObjktId()
  console.log(`Last id is : ${lastId}`)
  const uniqueIds = new Set()
  while (uniqueIds.size < count) {
    const id = rnd(firstId, lastId)
    console.log(id)
    uniqueIds.add(id)
  }
  try {
    let objkts = await fetchObjkts(Array.from(uniqueIds))
    return objkts.hic_et_nunc_token
  } catch (e) {
    console.error(e)
  }
}

export async function fetchObjkts(ids) {
  const { data } = await fetchGraphQL(
    `
    query Objkts($_in: [bigint!] = "") {
      hic_et_nunc_token(where: { id: {_in: $_in}, supply : { _neq : 0 }}) {
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
  return data.hic_et_nunc_token
}
