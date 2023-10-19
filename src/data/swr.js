import useSWR from 'swr'
import { bytes2Char } from '@taquito/utils'
import { DAO_TOKEN_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { getTzktData, fetchObjktDetails } from '@data/api'

function reorderBigmapData(data, subKey, decode = false) {
  const bigmapData = data ? {} : undefined
  data?.forEach(
    (item) =>
      (bigmapData[subKey ? item.key[subKey] : item.key] = decode
        ? bytes2Char(item.value)
        : item.value)
  )

  return bigmapData
}

export function useBalance(address) {
  const { data, mutate } = useSWR(
    address ? `/v1/accounts/${address}/balance` : null,
    getTzktData
  )

  return [data ? data / 1000000 : 0, mutate]
}

export function useDaoTokenBalance(address) {
  const parameters = {
    'token.contract': DAO_TOKEN_CONTRACT,
    'token.tokenId': '0',
    account: address,
    select: 'balance',
  }
  const { data, mutate } = useSWR(
    address ? [`/v1/tokens/balances`, parameters] : null,
    getTzktData
  )

  return [data?.[0] ? parseInt(data[0]) / DAO_TOKEN_DECIMALS : 0, mutate]
}

export function useStorage(contractAddress) {
  const { data, mutate } = useSWR(
    contractAddress ? `/v1/contracts/${contractAddress}/storage` : null,
    getTzktData
  )

  return [data, mutate]
}

export function useDaoGovernanceParameters(daoStorage) {
  const parameters = {
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    daoStorage?.governance_parameters
      ? [`/v1/bigmaps/${daoStorage.governance_parameters}/keys`, parameters]
      : null,
    getTzktData
  )

  return [reorderBigmapData(data), mutate]
}

export function useDaoProposals(daoStorage) {
  const parameters = {
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    daoStorage?.proposals
      ? [`/v1/bigmaps/${daoStorage.proposals}/keys`, parameters]
      : null,
    getTzktData
  )

  return [reorderBigmapData(data), mutate]
}

export function useDaoRepresentatives(daoStorage) {
  const { data, mutate } = useSWR(
    daoStorage?.representatives
      ? `/v1/contracts/${daoStorage.representatives}/storage`
      : null,
    getTzktData
  )

  const representatives = data?.representatives
    ? Object.fromEntries(
        Object.entries(data.representatives).sort(([, com1], [, com2]) => {
          if (com1 < com2) return -1
          if (com1 > com2) return 1
          return 0
        })
      )
    : undefined

  return [representatives, mutate]
}

export function useDaoUserVotes(address, daoStorage) {
  const parameters = {
    'key.address': address,
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    address && daoStorage?.token_votes
      ? [`/v1/bigmaps/${daoStorage.token_votes}/keys`, parameters]
      : null,
    getTzktData
  )

  return [reorderBigmapData(data, 'nat'), mutate]
}

export function useDaoCommunityVotes(community, daoStorage) {
  const parameters = {
    'key.string': community,
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    community && daoStorage?.representatives_votes
      ? [`/v1/bigmaps/${daoStorage.representatives_votes}/keys`, parameters]
      : null,
    getTzktData
  )

  return [reorderBigmapData(data, 'nat'), mutate]
}

export function useAliases(addresses) {
  if (addresses?.length === 1) addresses.push(addresses[0])

  const parameters = {
    'key.in': addresses?.join(','),
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    addresses?.length > 0 ? [`/v1/bigmaps/3919/keys`, parameters] : null,
    getTzktData
  )

  return [reorderBigmapData(data, undefined, true), mutate]
}

export function useDaoUsersAliases(userAddress, representatives, proposals) {
  const addresses = new Set()

  if (userAddress) {
    addresses.add(userAddress)
  }

  if (representatives) {
    Object.keys(representatives).forEach((address) => addresses.add(address))
  }

  if (proposals) {
    Object.values(proposals).forEach((proposal) => {
      addresses.add(proposal.issuer)

      if (proposal.kind.transfer_mutez) {
        proposal.kind.transfer_mutez.forEach((transfer) =>
          addresses.add(transfer.destination)
        )
      } else if (proposal.kind.transfer_token)
        proposal.kind.transfer_token.distribution.forEach((transfer) =>
          addresses.add(transfer.destination)
        )
    })
  }

  return useAliases(Array.from(addresses))
}

export function useDaoMemberCount(minTokens) {
  const parameters = {
    'token.contract': DAO_TOKEN_CONTRACT,
    'token.tokenId': '0',
    'balance.gt': minTokens * DAO_TOKEN_DECIMALS,
  }
  const { data, mutate } = useSWR(
    ['/v1/tokens/balances/count', parameters],
    getTzktData
  )

  return [data ? parseInt(data) : 0, mutate]
}

export function usePolls(pollsStorage) {
  const parameters = {
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    pollsStorage?.polls
      ? [`/v1/bigmaps/${pollsStorage.polls}/keys`, parameters]
      : null,
    getTzktData
  )

  return [reorderBigmapData(data), mutate]
}

export function useUserPollVotes(address, pollsStorage) {
  const parameters = {
    'key.address': address,
    limit: 10000,
    active: true,
    select: 'key,value',
  }
  const { data, mutate } = useSWR(
    address && pollsStorage?.votes
      ? [`/v1/bigmaps/${pollsStorage.votes}/keys`, parameters]
      : null,
    getTzktData
  )

  return [reorderBigmapData(data, 'nat'), mutate]
}

export function usePollsUsersAliases(userAddress, polls) {
  const addresses = new Set()

  if (userAddress) {
    addresses.add(userAddress)
  }

  if (polls) {
    Object.values(polls).forEach((poll) => {
      addresses.add(poll.issuer)
    })
  }

  return useAliases(Array.from(addresses))
}

export function useObjkt(id) {
  const { data, mutate } = useSWR(id || null, fetchObjktDetails, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  })

  return [data, mutate]
}
