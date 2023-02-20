import { Navigate, useParams } from 'react-router'
import useSWR from 'swr'
import get from 'lodash/get'
import { PATH } from '@constants'
import TokenCollection from '@atoms/token-collection'
import { fetchCollabCreations } from '@data/api'
import { CollaboratorType } from '@constants'
import { Loading } from '@atoms/loading'
import { useDisplayStore } from '@pages/profile'
import { useEffect } from 'react'
import type { SplitContract } from '@types'

export const CollabDisplay = () => {
  const { id, name } = useParams()

  const { data, error } = useSWR(
    !id || !name ? ['/contract', id, name] : null,
    async () => {
      const result = await fetchCollabCreations(
        name || id!,
        name ? 'subjkt' : 'address'
      )

      if (!result.split_contracts.length) {
        throw new Error('unknown split contract')
      }

      return {
        tokens: result.tokens,
        split_contract: result.split_contracts[0] as SplitContract,
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )
  useEffect(() => {
    useDisplayStore.setState({
      coreParticipants: get(data?.split_contract, 'shareholders', []).filter(
        ({ holder_type }) => holder_type === CollaboratorType.CORE_PARTICIPANT
      ),
    })
  }, [data?.split_contract])

  if (error) {
    return <pre>{JSON.stringify(error, null, 2)}</pre>
  }

  if (!data) {
    return <Loading message={'Collab contract'} />
  }

  const { split_contract, tokens } = data
  const address = split_contract?.contract_address

  const oldContractAddresses = [
    'KT1CSfR6kx3uwDEXpwuCPnqp3MhpzfPmnLKj',
    'KT1XhXv6jBpkahnvrtdiSi8foWXneWEjcz6F',
  ]

  if (id && oldContractAddresses.indexOf(id) > -1) {
    return <Navigate to={`${PATH.ISSUER}/${id}`} replace />
  }

  return (
    <>
      <TokenCollection
        namespace="collab-tokens"
        emptyMessage="This collab has no OBJKT creations to display"
        swrParams={[address]}
        query={{ tokens }}
      />
    </>
  )
}
