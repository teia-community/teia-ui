import useSWR from 'swr'
import axios from 'axios'
import { DAO_TOKEN_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'

export async function getTzktData(query, parameters) {
  const response = await axios.get(import.meta.env.VITE_TZKT_API + query, {
    params: parameters,
  })

  return response.data
}

export function useBalance(address) {
  const { data } = useSWR(
    address ? [`/v1/accounts/${address}/balance`, {}] : null,
    getTzktData
  )

  return data ? data / 1000000 : 0
}

export function useTokenBalance(address) {
  const parameters = {
    'token.contract': DAO_TOKEN_CONTRACT,
    'token.tokenId': '0',
    account: address,
    select: 'balance',
  }
  const { data } = useSWR(
    address ? [`/v1/tokens/balances`, parameters] : null,
    getTzktData
  )

  return data ? (data[0] ? parseInt(data[0]) / DAO_TOKEN_DECIMALS : 0) : 0
}

export function useStorage(address) {
  const { data } = useSWR(
    address ? [`/v1/contracts/${address}/storage`, {}] : null,
    getTzktData
  )

  return data
}

export function useGovernanceParameters(daoStorage) {
  const { data } = useSWR(
    daoStorage
      ? [`/v1/bigmaps/${daoStorage.governance_parameters}/keys`, {}]
      : null,
    getTzktData
  )

  const governanceParameters = data ? {} : undefined
  data?.forEach((gp) => (governanceParameters[gp.key] = gp.value))

  return governanceParameters
}

export function useProposals(daoStorage) {
  const { data } = useSWR(
    daoStorage ? [`/v1/bigmaps/${daoStorage.proposals}/keys`, {}] : null,
    getTzktData
  )

  return data
}

export function useRepresentatives(daoStorage) {
  const { data } = useSWR(
    daoStorage
      ? [`/v1/contracts/${daoStorage.representatives}/storage`, {}]
      : null,
    getTzktData
  )

  return data?.representatives
}

export function useUserVotes(address, daoStorage) {
  const parameters = { 'key.address': address }
  const { data } = useSWR(
    address && daoStorage
      ? [`/v1/bigmaps/${daoStorage.token_votes}/keys`, parameters]
      : null,
    getTzktData
  )

  const userVotes = data ? {} : undefined
  data?.forEach((vote) => (userVotes[vote.key.nat] = vote.value))

  return userVotes
}

export function useCommunityVotes(community, daoStorage) {
  const parameters = { 'key.string': community }
  const { data } = useSWR(
    community && daoStorage
      ? [`/v1/bigmaps/${daoStorage.representatives_votes}/keys`, parameters]
      : null,
    getTzktData
  )

  const communityVotes = data ? {} : undefined
  data?.forEach((vote) => (communityVotes[vote.key.nat] = vote.value))

  return communityVotes
}
