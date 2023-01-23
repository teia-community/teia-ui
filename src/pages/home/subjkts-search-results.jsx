import useSWR from 'swr'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { fetchGraphQL } from '@data/api'
import { useSearchParams, Link } from 'react-router-dom'
import laggy from '@utils/swr-laggy-middleware'

function SubjktsSearchResults() {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''

  const { data } = useSWR(
    ['subjkts-search', searchTerm],
    async (ns, term) => {
      const result = await fetchGraphQL(
        `
          query getSubjkts($subjkt: String!) {
            teia_users(
              where: { name: { _ilike: $subjkt } }
            ) {
              user_address
              name
              metadata {
                data
              }
            }
          }
        `,
        'getSubjkts',
        {
          subjkt: `%${term}%`,
        }
      )

      return result.data
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )

  const holders = uniqBy(
    get(data, 'teia_users') || [],
    ({ name }) => name
  ).filter(({ name }) => name)

  if (!holders.length) {
    return null
  }

  return (
    <div style={{ maxHeight: '200px', overflow: 'scroll' }}>
      {holders.map(({ name, metadata }) => (
        <div key={name} style={{ marginTop: '10px' }}>
          <Link to={`/${name}`}>{name}</Link>{' '}
          {get(metadata, 'data.description')}
        </div>
      ))}
    </div>
  )
}

export default SubjktsSearchResults
