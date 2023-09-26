import useSWR from 'swr'
import axios from 'axios'
import {
  DAO_GOVERNANCE_CONTRACT,
  DAO_TOKEN_CONTRACT,
  DAO_TOKEN_DECIMALS,
} from '@constants'
import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { Line } from '@atoms/line'
import styles from '@style'

export function DefaultLink(props) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className={props.className ? props.className : ''}
    >
      {props.children}
    </a>
  )
}

export function TzktLink(props) {
  return (
    <DefaultLink
      href={`https://tzkt.io/${props.address}`}
      className={props.className ? props.className : ''}
    >
      {props.children}
    </DefaultLink>
  )
}

export function TezosAddressLink(props) {
  return (
    <TzktLink
      address={props.address}
      className={`tezos-address ${props.className ? props.className : ''}`}
    >
      {props.children}
      {props.shorten
        ? props.address.slice(0, 5) + '...' + props.address.slice(-5)
        : props.address}
    </TzktLink>
  )
}

async function getTzktData(query, parameters) {
  const response = await axios.get(import.meta.env.VITE_TZKT_API + query, {
    params: parameters,
  })

  return response.data
}

function useStorage(address) {
  const { data } = useSWR(
    address ? [`/v1/contracts/${address}/storage`, {}] : null,
    getTzktData
  )

  return data
}

function useGovernanceParameters(daoStorage) {
  const { data } = useSWR(
    daoStorage
      ? [`/v1/bigmaps/${daoStorage.governance_parameters}/keys`, {}]
      : null,
    getTzktData
  )

  const governanceParameters = data ? {} : undefined
  data?.forEach((gp) => (governanceParameters[gp.key] = gp.value))

  return governanceParameters
}

function useRepresentatives(daoStorage) {
  const { data } = useSWR(
    daoStorage
      ? [`/v1/contracts/${daoStorage.representatives}/storage`, {}]
      : null,
    getTzktData
  )

  return data?.representatives
}

function useUserVotes(address, daoStorage) {
  const parameters = { 'key.address': address }
  const { data } = useSWR(
    address && daoStorage
      ? [`/v1/bigmaps/${daoStorage.token_votes}/keys`, parameters]
      : null,
    getTzktData
  )

  const userVotes = data ? {} : undefined
  data?.forEach((vote) => (userVotes[vote.key.nat] = vote.value))

  return userVotes
}

function useBalance(address) {
  const { data } = useSWR(
    address ? [`/v1/accounts/${address}/balance`, {}] : null,
    getTzktData
  )

  return data ? data / 1000000 : 0
}

function useTokenBalance(address) {
  const parameters = {
    'token.contract': DAO_TOKEN_CONTRACT,
    'token.tokenId': '0',
    account: address,
    select: 'balance',
  }
  const { data } = useSWR(
    address ? [`/v1/tokens/balances`, parameters] : null,
    getTzktData
  )

  return data ? (data[0] ? parseInt(data) / DAO_TOKEN_DECIMALS : 0) : 0
}

export const DaoParameters = () => {
  const userAddress = useUserStore((st) => st.address)
  const userTokenBalance = useTokenBalance(userAddress)
  const daoTokenBalance = useTokenBalance(DAO_GOVERNANCE_CONTRACT)
  const daoBalance = useBalance(DAO_GOVERNANCE_CONTRACT)
  const daoStorage = useStorage(DAO_GOVERNANCE_CONTRACT)
  const governanceParameters = useGovernanceParameters(daoStorage)
  const representatives = useRepresentatives(daoStorage)
  const userVotes = useUserVotes(userAddress, daoStorage)

  if (!daoStorage || !governanceParameters || !representatives)
    return (
      <Page title="DAO main parameters" large>
        <div className={styles.container}>
          <p>loading DAO information</p>
        </div>
      </Page>
    )

  // Get the current governance parameters
  const currentGovernanceParameters =
    governanceParameters[daoStorage.gp_counter - 1]

  // Calculate the vote scaling depending on the vote method
  const voteScaling = currentGovernanceParameters.vote_method.linear
    ? DAO_TOKEN_DECIMALS
    : Math.pow(DAO_TOKEN_DECIMALS, 0.5)

  // Get the community that the user represents
  const community = userAddress ? representatives[userAddress] : undefined

  return (
    <Page title="DAO main parameters" large>
      <div className={styles.container}>
        {userAddress && (
          <>
            <section className={styles.section}>
              <div className={styles.section_title}>
                <h1>User information</h1>
                <ul className="parameters-list">
                  <li>Address: {<TezosAddressLink address={userAddress} />}</li>
                  <li>
                    Teia Community:{' '}
                    {community ? community : 'not a community representative'}
                  </li>
                  <li>DAO token balance: {userTokenBalance} TEIA</li>
                  <li>
                    Voted in {userVotes ? Object.keys(userVotes).length : 0}{' '}
                    proposals.
                  </li>
                </ul>
              </div>
            </section>

            <Line />
          </>
        )}

        <section className={styles.section}>
          <div className={styles.section_title}>
            <h1>DAO smart contracts</h1>
            <ul className="parameters-list">
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
                DAO guardians:{' '}
                <TezosAddressLink address={daoStorage.guardians} />
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
          </div>
        </section>

        <Line />

        <section className={styles.section}>
          <div className={styles.section_title}>
            <h1>Current governance parameters</h1>
            <ul className="parameters-list">
              <li>
                Vote method:{' '}
                {currentGovernanceParameters.vote_method.linear
                  ? 'linear weight'
                  : 'quadratic weight'}
              </li>
              <li>
                Required quorum: {daoStorage.quorum / voteScaling} weighted
                votes
              </li>
              <li>
                Percentage for supermajority:{' '}
                {currentGovernanceParameters.supermajority}% positive votes
              </li>
              <li>
                Representatives vote share:{' '}
                {currentGovernanceParameters.representatives_share}% of the
                quorum
              </li>
              <li>
                Representative max vote share:{' '}
                {currentGovernanceParameters.representative_max_share}% of the
                quorum
              </li>
              <li>
                Proposal voting period:{' '}
                {currentGovernanceParameters.vote_period} days
              </li>
              <li>
                Proposal waiting period:{' '}
                {currentGovernanceParameters.wait_period} days
              </li>
              <li>
                Number of tokens to escrow to submit a proposal:{' '}
                {currentGovernanceParameters.escrow_amount / DAO_TOKEN_DECIMALS}{' '}
                TEIA tokens
              </li>
              <li>
                Minimum number of tokens required to vote a proposal:{' '}
                {currentGovernanceParameters.min_amount / DAO_TOKEN_DECIMALS}{' '}
                TEIA tokens
              </li>
            </ul>
          </div>
        </section>
      </div>
    </Page>
  )
}
