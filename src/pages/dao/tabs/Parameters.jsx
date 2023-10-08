import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { useUserStore } from '@context/userStore'
import { Loading } from '@atoms/loading'
import { Line } from '@atoms/line'
import { TeiaUserLink, TezosAddressLink } from '@atoms/link'
import {
  useBalance,
  useDaoTokenBalance,
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
  useDaoRepresentatives,
  useDaoUserVotes,
  useDaoCommunityVotes,
  useDaoUsersAliases,
  useDaoMemberCount,
} from '@data/swr'
import styles from '@style'

export const DaoParameters = () => {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [proposals] = useDaoProposals(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)
  const [daoMemberCount] = useDaoMemberCount(0)
  const [daoBalance] = useBalance(DAO_GOVERNANCE_CONTRACT)
  const [daoTokenBalance] = useDaoTokenBalance(DAO_GOVERNANCE_CONTRACT)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity = representatives?.[userAddress]
  const [userTokenBalance] = useDaoTokenBalance(userAddress)
  const [userVotes] = useDaoUserVotes(userAddress, daoStorage)
  const [userCommunityVotes] = useDaoCommunityVotes(userCommunity, daoStorage)

  // Get all the relevant users aliases
  const [usersAliases] = useDaoUsersAliases(
    userAddress,
    representatives,
    proposals
  )

  // Display the loading page information until all data is available
  if (!daoStorage || !governanceParameters || !representatives || !proposals) {
    return <Loading message="Loading DAO information" />
  }

  // Get the current governance parameters
  const currentGovernanceParameters =
    governanceParameters[daoStorage.gp_counter - 1]

  // Calculate the vote scaling depending on the vote method
  const voteScaling = currentGovernanceParameters.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

  // Invert the representatives map and sort the community keys
  const communities = {}
  const communitiesList = Object.values(representatives).sort()
  communitiesList.forEach((key) => (communities[key] = ''))
  Object.entries(representatives).forEach(
    ([representative, community]) => (communities[community] = representative)
  )

  // Calculate the number of times that the user has voted
  const numberOfTimesVoted = userVotes ? Object.keys(userVotes).length : 0
  const numberOfTimesVotedAsRepresentative = userCommunityVotes
    ? Object.keys(userCommunityVotes).length
    : 0

  return (
    <div className={styles.container}>
      {userAddress && (
        <>
          <section className={styles.section}>
            <h1 className={styles.section_title}>User information</h1>
            <ul className={styles.parameters_list}>
              <li>Address: {<TeiaUserLink address={userAddress} />}</li>
              {userCommunity && <li>Teia Community: {userCommunity}</li>}
              <li>
                DAO token balance: {Math.round(userTokenBalance * 10) / 10} TEIA
              </li>
              <li>
                Voted in {numberOfTimesVoted} proposal
                {numberOfTimesVoted === 1 ? '' : 's'}.
              </li>
              {userCommunity && (
                <li>
                  Voted in {numberOfTimesVotedAsRepresentative} proposal
                  {numberOfTimesVotedAsRepresentative === 1 ? '' : 's'} as
                  community representative.
                </li>
              )}
            </ul>
          </section>

          <Line />
        </>
      )}

      <section className={styles.section}>
        <h1 className={styles.section_title}>General information</h1>
        <ul className={styles.parameters_list}>
          <li>DAO members: {daoMemberCount}</li>
          <li>
            DAO Treasury balance: {Math.round(daoBalance)} tez and{' '}
            {Math.round(daoTokenBalance * 10) / 10} TEIA tokens
          </li>
          <li>Total number of proposals: {Object.keys(proposals).length}</li>
          <li>
            Executed proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.executed ? 1 : 0),
              0
            )}
          </li>
          <li>
            Rejected proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.rejected ? 1 : 0),
              0
            )}
          </li>
          <li>
            Cancelled proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.cancelled ? 1 : 0),
              0
            )}
          </li>
        </ul>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Community representatives</h1>
        <ul className={styles.parameters_list}>
          {Object.entries(communities).map(([community, representative]) => (
            <li key={community}>
              {community}:{' '}
              <TeiaUserLink
                address={representative}
                alias={usersAliases?.[representative]}
              />
            </li>
          ))}
        </ul>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>
          Current DAO governance parameters
        </h1>
        <ul className={styles.parameters_list}>
          <li>
            Vote method:{' '}
            {currentGovernanceParameters.vote_method.linear
              ? 'linear weight'
              : 'quadratic weight'}
          </li>
          <li>
            Required quorum: {daoStorage.quorum / voteScaling} weighted votes
          </li>
          <li>
            Percentage for supermajority:{' '}
            {currentGovernanceParameters.supermajority}% positive votes
          </li>
          <li>
            Representatives vote share:{' '}
            {currentGovernanceParameters.representatives_share}% of the quorum
          </li>
          <li>
            Representative max vote share:{' '}
            {currentGovernanceParameters.representative_max_share}% of the
            quorum
          </li>
          <li>
            Proposal voting period: {currentGovernanceParameters.vote_period}{' '}
            days
          </li>
          <li>
            Proposal waiting period: {currentGovernanceParameters.wait_period}{' '}
            days
          </li>
          <li>
            Number of tokens to escrow to submit a proposal:{' '}
            {currentGovernanceParameters.escrow_amount / DAO_TOKEN_DECIMALS}{' '}
            TEIA tokens
          </li>
          <li>
            Minimum number of tokens required to vote a proposal:{' '}
            {currentGovernanceParameters.min_amount / DAO_TOKEN_DECIMALS} TEIA
            tokens
          </li>
        </ul>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Smart contracts</h1>
        <ul className={styles.parameters_list}>
          <li>
            DAO governance:{' '}
            <TezosAddressLink address={DAO_GOVERNANCE_CONTRACT} />
          </li>
          <li>
            DAO token: <TezosAddressLink address={daoStorage.token} />
          </li>
          <li>
            DAO treasury: <TezosAddressLink address={daoStorage.treasury} />
          </li>
          <li>
            DAO guardians: <TezosAddressLink address={daoStorage.guardians} />
          </li>
          <li>
            DAO administrator:{' '}
            <TezosAddressLink address={daoStorage.administrator} />
          </li>
          <li>
            Community representatives:{' '}
            <TezosAddressLink address={daoStorage.representatives} />
          </li>
        </ul>
      </section>
    </div>
  )
}
