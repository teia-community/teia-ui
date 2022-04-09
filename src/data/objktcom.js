import get from 'lodash/get'
import padEnd from 'lodash/padEnd'
import { HEN_CONTRACT_FA2 } from '@constants'
const query_objktcom_asks = `
query getTokenAsks($tokenId: String! $fa2: String!) {
  token(where: {token_id: {_eq: $tokenId}, fa_contract: {_eq: $fa2}}) {
    creators {
      creator_address
    }
    royalties {
      receiver_address
      amount
      decimals
    }
    asks(
      order_by: {price: asc}
      where: {price: {_gt: 0}, _or: [{status: {_eq: "active"}, currency_id: {_eq: 1}, seller: {owner_operators: {token: {fa_contract: {_eq: $fa2}, token_id: {_eq: $tokenId}}, allowed: {_eq: true}}, held_tokens: {quantity: {_gt: "0"}, token: {fa_contract: {_eq: $fa2}, token_id: {_eq: $tokenId}}}}}, {contract_version: {_lt: 4}, status: {_eq: "active"}}]}
    ) {
      id
      amount
      amount_left
      price
      contract_version
      seller_address
      shares
      seller {
        alias
        address
      }
    }
  }
}
`

async function fetchGraphQL(
  operationsDoc,
  operationName,
  variables,
  graphqlApi
) {
  let result = await fetch(
    graphqlApi || process.env.REACT_APP_TEIA_GRAPHQL_API,
    {
      method: 'POST',
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName,
      }),
    }
  )
  return await result.json()
}

export async function fetchObjktcomAsks(id) {
  const { errors, data } = await fetchGraphQL(
    query_objktcom_asks,
    'getTokenAsks',
    {
      tokenId: id,
      fa2: HEN_CONTRACT_FA2,
    },
    process.env.REACT_APP_OBJKTCOM_GRAPHQL_API
  )
  if (errors) {
    console.error(errors)
    throw errors
  }

  const token = get(data, 'token.0')

  if (!token) {
    // this can be the case if the token wasn't indexed yet by objkt.com
    return []
  }

  const creatorAddresses = (token.creators || []).map(
    ({ creator_address }) => creator_address
  )
  const asks = token.asks || []
  const firstRoyalties = (token.royalties || [])[0]

  if (!firstRoyalties) {
    // for some reason the token has no royalties set, ignore asks in this case
    return []
  }

  return asks.filter((ask) => {
    const isPrimarySale = creatorAddresses.includes(ask.seller_address)

    // always keep the ask in the result-set if it was created by the artist
    if (isPrimarySale) {
      return true
    }

    if (!ask.shares.length) {
      // ask without royalties, discard
      return false
    }

    // for now, we will just inspect the first share
    const firstShare = ask.shares[0]

    if (!creatorAddresses.includes(firstShare.recipient)) {
      // the artist should always be the first recipient when it's a secondary ask
      return false
    }

    if (firstRoyalties.receiver_address !== firstShare.recipient) {
      // mismatch in the royalties receiver defined in the token vs what was defined in the ask
      return false
    }

    if (
      padEnd(firstRoyalties.amount, 4, '0') !==
      padEnd(firstShare.amount, 4, '0')
    ) {
      // mismatch in royalties, discard
      return false
    }

    return true
  })
}
