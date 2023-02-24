import useSWR from 'swr'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { fetchGraphQL } from '@data/api'
import { useSearchParams, Link } from 'react-router-dom'
import laggy from '@utils/swr-laggy-middleware'
import styles from '@style'
import { Identicon } from '@atoms/identicons'
import { Line } from '@atoms/line'
import { gql } from 'graphql-request'
function SubjktsSearchResults() {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''

  const { data } = useSWR(
    ['subjkts-search', searchTerm],
    async (ns, term) => {
      const result = await fetchGraphQL(
        gql`
          query getSubjkts($subjkt: String!) {
            teia_users(where: { name: { _ilike: $subjkt } }) {
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
    <div className={styles.container}>
      {holders.map(({ user_address, name, metadata }) => (
        <div key={name} className={styles.subjkt_result}>
          <div className={styles.flex}>
            <Link className={styles.user_box} to={`/${name}`}>
              {metadata.data && (
                <Identicon
                  className={styles.subjkt_icon}
                  address={user_address}
                  logo={metadata.data?.identicon}
                />
              )}
              <p className={styles.user}>{name}</p>
            </Link>{' '}
            <p className={styles.description}>
              {get(metadata, 'data.description')}
            </p>
          </div>
          <Line key={`${name}-line`} />
        </div>
      ))}
    </div>
  )
}

export default SubjktsSearchResults
