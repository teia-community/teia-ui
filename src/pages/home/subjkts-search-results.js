import useSWR from 'swr'
import _ from 'lodash'
import { gql } from 'graphql-request'
import { request } from 'graphql-request'
import { useSearchParams, Link } from 'react-router-dom'
import laggy from '../../utils/swr-laggy-middleware'

function SubjktsSearchResults() {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''

  const { data } = useSWR(
    ['subjkts-search', searchTerm],
    (ns, term) =>
      request(
        process.env.REACT_APP_TEIA_GRAPHQL_API,
        gql`
          query getSubjkts($subjkt: String!) {
            holder(
              where: { name: { _ilike: $subjkt } }
              order_by: { hdao_balance: desc }
            ) {
              address
              name
              hdao_balance
              metadata
            }
          }
        `,
        {
          subjkt: `%${term}%`,
        }
      ),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  )

  const holders = _.uniqBy(
    _.get(data, 'holder') || [],
    ({ name }) => name
  ).filter(({ name }) => name)

  if (!holders.length) {
    return null
  }

  return (
    <div style={{ maxHeight: '200px', overflow: 'scroll' }}>
      {holders.map(({ name, metadata }) => (
        <div key={name} style={{ marginTop: '10px' }}>
          <Link to={`/${name}`}>{name}</Link> {metadata.description}
        </div>
      ))}
    </div>
  )
}

export default SubjktsSearchResults
