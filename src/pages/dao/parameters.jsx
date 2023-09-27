import { DAO_GOVERNANCE_CONTRACT, DAO_TOKEN_DECIMALS } from '@constants'
import { useUserStore } from '@context/userStore'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { Line } from '@atoms/line'
import styles from '@style'
import { TezosAddressLink } from './links'
import {
  useBalance,
  useTokenBalance,
  useStorage,
  useGovernanceParameters,
  useRepresentatives,
  useUserVotes,
} from './hooks'

export const DaoParameters = () => {
  // Get all the required DAO information
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)
  const representatives = useRepresentatives(daoStorage)
  const daoBalance = useBalance(DAO_GOVERNANCE_CONTRACT)
  const daoTokenBalance = useTokenBalance(DAO_GOVERNANCE_CONTRACT)

  // Get all the required user information
  const userAddress = useUserStore((st) => st.address)
  const userCommunity =
    userAddress && representatives ? representatives[userAddress] : undefined
  const userTokenBalance = useTokenBalance(userAddress)
  const userVotes = useUserVotes(userAddress, daoStorage)

  // Display the loading page information until all data is available
  if (!daoStorage || !governanceParameters || !representatives)
    return (
      <Page title="DAO main parameters" large>
        <Loading message="loading DAO information" />
      </Page>
    )

  // Get the current governance parameters
  const currentGovernanceParameters =
    governanceParameters[daoStorage.gp_counter - 1]

  // Calculate the vote scaling depending on the vote method
  const voteScaling = currentGovernanceParameters.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

  // Calculate the number of times that the user has voted
  const numberOfTimesVoted = userVotes ? Object.keys(userVotes).length : 0

  return (
    <Page title="DAO main parameters" large>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1>DAO main parameters</h1>
        </div>

        {userAddress && (
          <>
            <section className={styles.section}>
              <h1 className={styles.section_title}>User information</h1>
              <ul className={styles.parameters_list}>
                <li>Address: {<TezosAddressLink address={userAddress} />}</li>
                <li>
                  Teia Community:{' '}
                  {userCommunity
                    ? userCommunity
                    : 'not a community representative'}
                </li>
                <li>
                  DAO token balance: {Math.round(userTokenBalance * 10) / 10}{' '}
                  TEIA
                </li>
                <li>
                  Voted in {numberOfTimesVoted} proposal
                  {numberOfTimesVoted === 1 ? '' : 's'}
                </li>
              </ul>
            </section>

            <Line />
          </>
        )}

        <section className={styles.section}>
          <h1 className={styles.section_title}>DAO smart contracts</h1>
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
              Teia Community representatives:{' '}
              <TezosAddressLink address={daoStorage.representatives} />
            </li>
            <li>
              DAO treasury balance: {daoBalance} ꜩ and {daoTokenBalance} TEIA
              tokens
            </li>
          </ul>
        </section>

        <Line />

        <section className={styles.section}>
          <h1 className={styles.section_title}>
            Current governance parameters
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
      </div>
    </Page>
  )
}
