import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { useUserStore } from '@context/userStore'
import { Line } from '@atoms/line'
import { TeiaUserLink, TezosAddressLink } from '@atoms/link'
import {
  useStorage,
  useDaoGovernanceParameters,
  useDaoProposals,
  useDaoRepresentatives,
  useDaoMemberCount,
  useBalance,
  useDaoTokenBalance,
  useDaoUserVotes,
  useDaoCommunityVotes,
  useDaoUsersAliases,
} from '@data/swr'
import LoadingDaoMessage from '../LoadingDaoMessage'
import styles from '@style'

export default function DaoParameters() {
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
  if (!governanceParameters || !proposals || !representatives) {
    return <LoadingDaoMessage />
  }

  // Get the current governance parameters
  const gp = governanceParameters[daoStorage.gp_counter - 1]

  // Calculate the vote scaling depending on the vote method
  const voteScaling = gp.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

  // Calculate the number of times that the user has voted
  const numberOfTimesVoted = userVotes ? Object.keys(userVotes).length : 0
  const numberOfTimesVotedAsRepresentative = userCommunityVotes
    ? Object.keys(userCommunityVotes).length
    : 0

  return (
    <>
      {userAddress && (
        <>
          <section className={styles.section}>
            <h1 className={styles.section_title}>User information</h1>

            <ul className={styles.parameters_list}>
              <li>Address: {<TeiaUserLink address={userAddress} shorten />}</li>
              {userCommunity && <li>Representative for {userCommunity}.</li>}
              <li>
                DAO token balance: {Math.round(userTokenBalance * 10) / 10} TEIA
              </li>
              <li>
                Submited proposals:{' '}
                {Object.values(proposals).reduce(
                  (acc, proposal) =>
                    acc + (proposal.issuer === userAddress ? 1 : 0),
                  0
                )}
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
        <h1 className={styles.section_title}>DAO information</h1>

        <ul className={styles.parameters_list}>
          <li>Members: {daoMemberCount}</li>
          <li>Total number of proposals: {Object.keys(proposals).length}</li>
          <li>
            Open proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.open ? 1 : 0),
              0
            )}
          </li>
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
          <li>
            Treasury balance: {Math.round(daoBalance)} tez and{' '}
            {Math.round(daoTokenBalance * 10) / 10} TEIA tokens
          </li>
        </ul>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Community representatives</h1>

        <ul className={styles.parameters_list}>
          {Object.entries(representatives).map(
            ([representative, community]) => (
              <li key={community}>
                {`${community}: `}
                <TeiaUserLink
                  address={representative}
                  alias={usersAliases?.[representative]}
                  shorten
                />
              </li>
            )
          )}
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
            {gp.vote_method.linear ? 'linear weight' : 'quadratic weight'}
          </li>
          <li>
            Required quorum: {daoStorage.quorum / voteScaling} weighted votes
          </li>
          <li>
            Percentage for supermajority: {gp.supermajority}% positive votes
          </li>
          <li>
            Representatives vote share: {gp.representatives_share}% of the
            quorum
          </li>
          <li>
            Representative max vote share: {gp.representative_max_share}% of the
            quorum
          </li>
          <li>Proposal voting period: {gp.vote_period} days</li>
          <li>Proposal waiting period: {gp.wait_period} days</li>
          <li>
            Number of tokens to escrow to submit a proposal:{' '}
            {gp.escrow_amount / DAO_TOKEN_DECIMALS} TEIA tokens
          </li>
          <li>
            Minimum number of tokens required to vote a proposal:{' '}
            {gp.min_amount / DAO_TOKEN_DECIMALS} TEIA tokens
          </li>
        </ul>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Smart contracts</h1>

        <ul className={styles.parameters_list}>
          <li>
            DAO governance:{' '}
            <TezosAddressLink address={DAO_GOVERNANCE_CONTRACT} shorten />
          </li>
          <li>
            DAO token: <TezosAddressLink address={daoStorage.token} shorten />
          </li>
          <li>
            DAO treasury:{' '}
            <TezosAddressLink address={daoStorage.treasury} shorten />
          </li>
          <li>
            DAO guardians:{' '}
            <TezosAddressLink address={daoStorage.guardians} shorten />
          </li>
          <li>
            DAO administrator:{' '}
            <TezosAddressLink address={daoStorage.administrator} shorten />
          </li>
          <li>
            Community representatives:{' '}
            <TezosAddressLink address={daoStorage.representatives} shorten />
          </li>
        </ul>
      </section>
    </>
  )
}
