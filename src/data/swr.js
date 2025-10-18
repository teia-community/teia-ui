import useSWR from 'swr'
import { bytes2Char } from '@taquito/utils'
import { DAO_TOKEN_CONTRACT, DAO_TOKEN_DECIMALS, COPYRIGHT_CONTRACT, DAO_TREASURY_CONTRACT, HEN_CONTRACT_FA2  } from '@constants'
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
  const { data, mutate } = useSWR(
    id ? ['/poll/objkt/', id] : null,
    async (_, id) => fetchObjktDetails(id),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  return [data, mutate]
}

export const fetchTokenMetadataForCopyrightSearch = async (contractAddress, tokenId) => {
    // Use TEIA GraphQL API via fetchObjktDetails
  if (contractAddress === HEN_CONTRACT_FA2) {
    try {
      const tokenData = await fetchObjktDetails(tokenId.toString())
      
      console.log('swr result ', tokenData)
      if (tokenData) {
        let creators = []
        if (tokenData.artist_profile?.is_split && tokenData.artist_profile?.split_contract?.shareholders) {
          // For split contracts, include all shareholders as creators
          creators = tokenData.artist_profile.split_contract.shareholders.map(s => s.shareholder_address)
        } else {
          // Single creator
          creators = [tokenData.artist_address]
        }
        
        return {
          contract: {
            address: tokenData.fa2_address
          },
          tokenId: tokenData.token_id,
          metadata: {
            name: tokenData.name,
            description: tokenData.description,
            displayUri: tokenData.display_uri,
            thumbnailUri: tokenData.thumbnail_uri,
            artifactUri: tokenData.artifact_uri,
            mimeType: tokenData.mime_type,
            creators: creators,
            decimals: "0",
            royalties: tokenData.royalties,
            editions: tokenData.editions,
            mintedAt: tokenData.minted_at,
            tags: tokenData.tags?.map(t => t.tag) || [],
            artist_profile: tokenData.artist_profile,
            teia_meta: tokenData.teia_meta,
            rights: tokenData.rights,
            right_uri: tokenData.right_uri
          }
        }
      }
    } catch (error) {
      console.log('Error fetching from TEIA GraphQL, falling back to TzKT:', error)
    }
  }
  
  // Default TzKT API for non-HEN tokens
  const url = `${import.meta.env.VITE_TZKT_API}/v1/tokens?contract=${contractAddress}&tokenId=${tokenId}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch metadata')
  const data = await response.json()
  return data[0]
}

export async function fetchUserCopyrights(address) {
  if (!address) return []

  const url = `${
    import.meta.env.VITE_TZKT_API
  }/v1/contracts/${COPYRIGHT_CONTRACT}/bigmaps/copyrights/keys?key.address=${address}&limit=100&active=true`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`TzKT API error: ${res.statusText}`)
    }

    const data = await res.json()
    return data
  } catch (err) {
    console.error('Failed to fetch user copyrights:', err)
    return []
  }
}

export async function fetchAllCopyrights() {
  const url = `${
    import.meta.env.VITE_TZKT_API
  }/v1/contracts/${COPYRIGHT_CONTRACT}/bigmaps/copyrights/keys?limit=100&active=true`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`TzKT API error: ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch all copyrights:', err)
    return []
  }
}

export async function fetchProposals() {
  const url = `${
    import.meta.env.VITE_TZKT_API
  }/v1/contracts/${COPYRIGHT_CONTRACT}/bigmaps/proposals/keys?limit=100&active=true`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`TzKT API error: ${res.statusText}`)
    }

    return await res.json()
  } catch (err) {
    console.error('Failed to fetch proposals:', err)
    return []
  }
}

export async function fetchAllVotes() {
  const url = `${
    import.meta.env.VITE_TZKT_API
  }/v1/contracts/${COPYRIGHT_CONTRACT}/bigmaps/votes/keys?limit=500&active=true`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`TzKT API error: ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch votes:', err)
    return []
  }
}

export async function fetchExpirationTime() {
  const url = `${
    import.meta.env.VITE_TZKT_API
  }/v1/contracts/${DAO_TREASURY_CONTRACT}/storage?path=expiration_time`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`TzKT API error: ${res.statusText}`)
    const data = await res.json()
    return parseInt(data)
  } catch (err) {
    console.error('Failed to fetch expiration_time:', err)
    return 0
  }
}

export async function fetchAgreementText() {
  const url = `${
    import.meta.env.VITE_TZKT_API
  }/v1/contracts/${COPYRIGHT_CONTRACT}/storage?path=agreement_text`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`TzKT API error: ${res.statusText}`)
    const data = await res.json()
    return data
  } catch (err) {
    console.error('Failed to fetch expiration_time:', err)
    return 0
  }
}

export function useDaoTokenHolders(limit = 10) {
  const { data, mutate, error } = useSWR(
    [`/dao/token-holders/${limit}`, limit],
    async () => {
      const url = `${
        import.meta.env.VITE_TZKT_API
      }/v1/tokens/balances?token.contract.eq=${DAO_TOKEN_CONTRACT}&token.tokenId.eq=0&sort.desc=balance&limit=${limit}`

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`TzKT API error: ${res.statusText}`)
        const holders = await res.json()

        return holders.map((holder) => ({
          address: holder.account.address,
          alias: holder.account.alias,
          balance: parseInt(holder.balance) / DAO_TOKEN_DECIMALS,
          transfersCount: holder.transfersCount,
          firstTime: holder.firstTime,
          lastTime: holder.lastTime,
        }))
      } catch (err) {
        console.error('Failed to fetch token holders:', err)
        throw err
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  return { data, mutate, error, isLoading: !data && !error }
}

export function useFountainDonations(contractAddress, limit = 10000) {
  const { data, mutate, error } = useSWR(
    contractAddress
      ? [`/contract-donations/${contractAddress}`, contractAddress, limit]
      : null,
    async () => {
      const url = `${
        import.meta.env.VITE_TZKT_API
      }/v1/operations/transactions?target=${contractAddress}&select=sender,amount,timestamp&limit=${limit}&status=applied`

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`TzKT API error: ${res.statusText}`)
        const transactions = await res.json()
        return transactions
      } catch (err) {
        console.error('Failed to fetch contract donations:', err)
        throw err
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )

  return { data, mutate, error, isLoading: !data && !error }
}
