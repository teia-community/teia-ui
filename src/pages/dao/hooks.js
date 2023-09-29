import useSWR from 'swr'
import axios from 'axios'
import { DAO_TOKEN_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { hexToString } from '@utils/string'

async function getTzktData(query, parameters = {}, debug = false) {
  const url = import.meta.env.VITE_TZKT_API + query
  const response = await axios
    .get(url, { params: parameters })
    .catch((error) =>
      console.log(`The following TzKT query returned an error: ${url}`, error)
    )

  if (debug) console.log(`Executed TzKT query: ${url}`, parameters)

  return response?.data
}

function reorderBigmapData(data, subKey = undefined, decode = false) {
  const bigmapData = data?.length > 0 ? {} : undefined
  data?.forEach(
    (item) =>
      (bigmapData[subKey ? item.key[subKey] : item.key] = decode
        ? hexToString(item.value)
        : item.value)
  )

  return bigmapData
}

export function useBalance(address) {
  const { data } = useSWR(
    address ? `/v1/accounts/${address}/balance` : null,
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

  return data?.[0] ? parseInt(data[0]) / DAO_TOKEN_DECIMALS : 0
}

export function useStorage(contractAddress) {
  const { data } = useSWR(
    contractAddress ? `/v1/contracts/${contractAddress}/storage` : null,
    getTzktData
  )

  return data
}

export function useGovernanceParameters(daoStorage) {
  const parameters = {
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data } = useSWR(
    daoStorage
      ? [`/v1/bigmaps/${daoStorage.governance_parameters}/keys`, parameters]
      : null,
    getTzktData
  )

  return reorderBigmapData(data)
}

export function useProposals(daoStorage) {
  const parameters = {
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data } = useSWR(
    daoStorage
      ? [`/v1/bigmaps/${daoStorage.proposals}/keys`, parameters]
      : null,
    getTzktData
  )

  return reorderBigmapData(data)
}

export function useRepresentatives(daoStorage) {
  const { data } = useSWR(
    daoStorage ? `/v1/contracts/${daoStorage.representatives}/storage` : null,
    getTzktData
  )

  return data?.representatives
}

export function useUserVotes(address, daoStorage) {
  const parameters = {
    'key.address': address,
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data } = useSWR(
    address && daoStorage
      ? [`/v1/bigmaps/${daoStorage.token_votes}/keys`, parameters]
      : null,
    getTzktData
  )

  return reorderBigmapData(data, 'nat')
}

export function useCommunityVotes(community, daoStorage) {
  const parameters = {
    'key.string': community,
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data } = useSWR(
    community && daoStorage
      ? [`/v1/bigmaps/${daoStorage.representatives_votes}/keys`, parameters]
      : null,
    getTzktData
  )

  return reorderBigmapData(data, 'nat')
}

export function useUsersAliases(userAddress, representatives, proposals) {
  const addresses = []
  if (userAddress) addresses.push(userAddress)
  if (representatives)
    Object.keys(representatives).forEach((address) => addresses.push(address))
  if (proposals)
    Object.values(proposals).forEach((proposal) =>
      addresses.push(proposal.issuer)
    )

  const parameters = {
    'key.in': addresses.join(','),
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data } = useSWR(
    representatives && proposals ? [`/v1/bigmaps/3919/keys`, parameters] : null,
    getTzktData
  )

  return reorderBigmapData(data, undefined, true)
}

export function useDaoMemberCount() {
  const parameters = {
    'token.contract': DAO_TOKEN_CONTRACT,
    'token.tokenId': '0',
    'balance.gt': 0 * DAO_TOKEN_DECIMALS,
  }
  const { data } = useSWR(
    ['/v1/tokens/balances/count', parameters],
    getTzktData
  )

  return data ? parseInt(data) : 0
}
