import useSWR from 'swr';
import uniqBy from 'lodash/uniqBy';
import { fetchGraphQL } from '@data/api';
import { useSearchParams, Link } from 'react-router-dom';
import laggy from '@utils/swr-laggy-middleware';
import styles from '@style';
import { Identicon } from '@atoms/identicons';
import { Line } from '@atoms/line';
import { gql } from 'graphql-request';

type Subjkt = {
  user_address: string;
  name: string | null;
  metadata?: {
    data?: {
      identicon?: string;
      description?: string;
    };
  };
};

type SubjktsResponse = {
  teia_users: Subjkt[];
};

function SubjktsSearchResults() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('term') || '';

  const { data } = useSWR<SubjktsResponse>(
    ['subjkts-search', searchTerm],
    async ([, term]) => {
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
        { subjkt: `%${term}%` }
      );

      return result.data as SubjktsResponse;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      use: [laggy],
    }
  );

  const holders = uniqBy(data?.teia_users ?? [], u => u.name).filter(
    (u): u is Subjkt & { name: string } => Boolean(u.name)
  );

  if (!holders.length) {
    return null;
  }

  return (
    <div className={styles.container}>
      {holders.map(({ user_address, name, metadata }) => (
        <div key={name} className={styles.subjkt_result}>
          <div className={styles.flex}>
            <Link className={styles.user_box} to={`/${encodeURIComponent(name)}`}>
              {metadata?.data && (
                <Identicon
                  className={styles.subjkt_icon}
                  address={user_address}
                  logo={metadata.data.identicon}
                />
              )}
              <p className={styles.user}>{name}</p>
            </Link>
            <p className={styles.description}>{metadata?.data?.description}</p>
          </div>
          <Line />
        </div>
      ))}
    </div>
  );
}

export default SubjktsSearchResults;