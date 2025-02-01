import {
  DAO_GOVERNANCE_CONTRACT,
  DAO_TOKEN_CONTRACT,
  DAO_TOKEN_DECIMALS,
} from '@constants'
import { useUserStore } from '@context/userStore'
import { Line } from '@atoms/line'
import { TeiaUserLink, TezosAddressLink, TzktLink } from '@atoms/link'
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

  // Calculate the vote scaling depending on the vote method
  const gp = governanceParameters[daoStorage.gp_counter - 1]
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
            <h1 className={styles.section_title}>User Information</h1>
            <p>Your activities with the TEIA DAO is listed here.</p>
            <ul className={styles.parameters_list}>
              <li>Address: {<TeiaUserLink address={userAddress} shorten />}</li>
              {userCommunity && <li>Representative for {userCommunity}.</li>}
              <li>
                DAO Token Balance: {Math.round(userTokenBalance * 10) / 10} TEIA
              </li>
              <li>
                Submitted Proposals:{' '}
                {Object.values(proposals).reduce(
                  (acc, proposal) =>
                    acc + (proposal.issuer === userAddress ? 1 : 0),
                  0
                )}
              </li>
              <li>
                Voted in {numberOfTimesVoted} Proposal
                {numberOfTimesVoted === 1 ? '' : 's'}.
              </li>
              {userCommunity && (
                <li>
                  Voted in {numberOfTimesVotedAsRepresentative} Proposal
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
        <h1 className={styles.section_title}>DAO Information</h1>
        <p>
          Community-wide statistics and usage activities of the TEIA DAO. To
          learn more about the the ideas and philosophies behind the DAO, visit
          the{' '}
          <a
            href="https://blog.teia.art/blog/dao-test-launch"
            target="_blank"
            rel="noopener noreferrer"
          >
            official blog post
          </a>{' '}
          after the DAO's first launch. For detailed information on governance
          processes, check out the{' '}
          <a
            href="https://github.com/teia-community/teia-docs/wiki/Governance-on-Teia"
            target="_blank"
            rel="noopener noreferrer"
          >
            Governance on Teia Documentation
          </a>
          .
        </p>
        <ul className={styles.parameters_list}>
          <li>
            Members:{' '}
            <TzktLink link={`${DAO_TOKEN_CONTRACT}/tokens/0/holders`}>
              {daoMemberCount} (Click for List of Existing Members)
            </TzktLink>
          </li>
          <li>Total Number of Proposals: {Object.keys(proposals).length}</li>
          <li>
            Open Proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.open ? 1 : 0),
              0
            )}
          </li>
          <li>
            Executed Proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.executed ? 1 : 0),
              0
            )}
          </li>
          <li>
            Rejected Proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.rejected ? 1 : 0),
              0
            )}
          </li>
          <li>
            Cancelled Proposals:{' '}
            {Object.values(proposals).reduce(
              (acc, proposal) => acc + (proposal.status.cancelled ? 1 : 0),
              0
            )}
          </li>
          <li>
            Treasury Balance: {Math.round(daoBalance)} tez and{' '}
            {Math.round(daoTokenBalance * 10) / 10} TEIA tokens
          </li>
        </ul>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Community Representatives</h1>
        <p>
          Community Representatives are for voting members who are interested in
          delegating their votes to other members of the community - people may
          want to entrust their voting power to someone who is more active in
          the DAO proposal process to represent them, for example. Otherwise,
          the DAO defaults to direct participation based on the number of TEIA
          tokens each wallet holds.
        </p>
        <p>For more information, read the </p>
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
          Current DAO Governance Parameters
        </h1>
        <p>
          How the current governance model works in terms of voting, timing, and
          weighting of each vote. These parameters can change at any time -
          however, to change these parameters it must be done so by the approval
          of the DAO itself.
        </p>
        <ul className={styles.parameters_list}>
          <li>
            Vote Method:{' '}
            {gp.vote_method.linear ? 'linear weight' : 'quadratic weight'}
          </li>
          <li>
            Required Quorum: {daoStorage.quorum / voteScaling} weighted votes
          </li>
          <li>
            Percentage for Supermajority: {gp.supermajority}% positive votes
          </li>
          <li>
            Representatives Vote Share: {gp.representatives_share}% of the
            quorum
          </li>
          <li>
            Representative Max Vote Share: {gp.representative_max_share}% of the
            quorum
          </li>
          <li>Proposal Voting Period: {gp.vote_period} Days</li>
          <li>Proposal Waiting Period: {gp.wait_period} Days</li>
          <li>
            Number of Tokens to Escrow to Submit a Proposal:{' '}
            {gp.escrow_amount / DAO_TOKEN_DECIMALS} TEIA tokens
          </li>
          <li>
            Minimum Number of Tokens Required to Vote on a Proposal:{' '}
            {gp.min_amount / DAO_TOKEN_DECIMALS} TEIA tokens
          </li>
        </ul>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Smart Contracts</h1>
        <p>
          The current set of smart contracts that keep the DAO running on a
          technical level. These contracts may be replaced or updated on
          occasion for adjustments or improvements, but can only be done through
          the approval of the DAO's proposal process.
        </p>
        <ul className={styles.parameters_list}>
          <li>
            DAO Governance:{' '}
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

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Polls</h1>
        <p>
          TEIA's polling system is a community tool that any TEIA member can use
          for any purpose - it is often used for feature requests, testing
          interest or getting feedback for ideas (artistic or technical),
          measuring community sentiment around certain issues, or just for fun.
        </p>
        <p>
          TEIA's polling system can be found{' '}
          <a href="/polls/" target="_blank">
            here.
          </a>{' '}
          (The DAO is typically reserved for issues that affect core
          administration, budgeting, and existential issues that require the
          full participation of the community itself.)
        </p>
      </section>
    </>
  )
}
