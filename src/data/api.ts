// import { HEN_CONTRACT_FA2 } from '@constants'
// import axios from 'axios'
import axios from 'axios'
import { gql, GraphQLClient } from 'graphql-request'
import { getSdk, getSdkWithHooks } from '../gql'

const client = new GraphQLClient(import.meta.env.VITE_TEIA_GRAPHQL_API)
const clientTZP = new GraphQLClient(import.meta.env.VITE_TZPROFILES_GRAPHQL_API)
export const api = getSdk(client)
export const apiTzp = getSdk(clientTZP)
export const apiSWR = getSdkWithHooks(client)

export async function fetchGraphQL(
  operationsDoc: string,
  operationName: string,
  variables: { [key: string]: any }
) {
  const result = await fetch(import.meta.env.VITE_TEIA_GRAPHQL_API, {
    method: 'POST',
    body: JSON.stringify({
      query: gql`
        ${operationsDoc}
      `,
      variables,
      operationName,
    }),
  })

  return await result.json()
}

export const getNameForAddress = gql`
  query GetNameForAddress($address: String!) {
    teia_users(where: { user_address: { _eq: $address } }) {
      name
    }
  }
`

// TODO: add all supported event types

export async function getUser(addressOrSubjkt: string, type = 'user_address') {
  // const { data } = await fetchGraphQL(
  //   type === 'name' ? userByName : userByAddress,
  //   'addressQuery',
  //   {
  //     addressOrSubjkt,
  //   }
  // )
  const query = type === 'name' ? api.userByName : api.userByAddress
  const data = await query({ addressOrSubjkt })
  console.log({ data })
  return data?.teia_users?.length ? data.teia_users[0] : null

  // return data?.teia_users?.length ? data.teia_users[0] : null
}

export async function fetchCollabCreations(
  addressOrSubjkt?: string,
  type = 'address'
) {
  if (!addressOrSubjkt) return
  // const { data } = await fetchGraphQL(
  //   type === 'address' ? collabCreationsFromAddress : collabCreationsFromName,
  //   'GetCollabCreations',
  //   { addressOrSubjkt }
  // )
  const query =
    type === 'address'
      ? api.collabCreationsFromAddress
      : api.collabCreationsFromName
  const data = await query({ addressOrSubjkt })
  return data
}

export async function fetchObjktDetails(id: string) {
  // const { data } = await fetchGraphQL(query_objkt, 'objkt', {
  //   id,
  // })
  const data = await api.objkt({ id })
  return data.tokens_by_pk
}

/**
 * Get User claims from their tzprofile
 */
const GetUserClaims = async (walletAddr: string) => {
  return await axios.post(import.meta.env.VITE_TZPROFILES_GRAPHQL_API, {
    query: `query MyQuery { tzprofiles_by_pk(account: "${walletAddr}") { valid_claims } }`,
    variables: null,
    operationName: 'MyQuery',
  })
}

/**
 * Get User Metadata
 */
export const GetUserMetadata = async (walletAddr: string) => {
  const tzktData: TzktData = {}

  const tzpData: TzpMetadata = {}
  try {
    const claims = await GetUserClaims(walletAddr)
    if (claims.data.data.tzprofiles_by_pk !== null) {
      for (const claim of claims.data.data.tzprofiles_by_pk.valid_claims) {
        const claimJSON = JSON.parse(claim[1])
        if (claimJSON.type.includes('TwitterVerification')) {
          if (!tzktData.data || !tzktData.data.twitter) {
            tzpData.twitter = claimJSON.evidence.handle
          }
        } else if (claimJSON.type.includes('BasicProfile')) {
          if (
            claimJSON.credentialSubject.alias !== '' &&
            !tzktData.data?.alias
          ) {
            tzpData.alias = claimJSON.credentialSubject.alias
          }
          tzpData.tzprofile = walletAddr
        } else if (claimJSON.type.includes('DiscordVerification')) {
          if (!tzktData.data) {
            tzpData.discord = claimJSON.evidence.handle
          }
        } else if (claimJSON.type.includes('GitHubVerification')) {
          if (!tzktData.data) {
            tzpData.github = claimJSON.evidence.handle
          }
        } else if (
          claimJSON.type.includes('DnsVerification') &&
          !tzktData.data
        ) {
          tzpData.dns = claimJSON.credentialSubject.sameAs.slice(4)
        }
      }
    }
  } catch (e: any) {
    console.error(e, e.stack)
  }

  if (tzpData) {
    tzktData.data = tzpData
  }
  return tzktData
}
