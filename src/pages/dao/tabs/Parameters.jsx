import { Link } from 'react-router-dom'
import {
  DAO_GOVERNANCE_CONTRACT,
  DAO_TOKEN_CONTRACT,
  DAO_TOKEN_DECIMALS,
  DAO_TREASURY_CONTRACT,
  QUIPUSWAP_TEIA_URL,
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
import { useMultisigProposals } from '@data/multisig'
import { useTeiaFees } from '@data/teia-fees'
import { useDaoToken } from '@data/dao-token'
import LoadingDaoMessage from '../LoadingDaoMessage'
import DonateInput from '@atoms/button/DonateButton'
import TokenHolders from '@components/dao/TokenHolders'
import styles from '@style'

const number = (value, digits = 0) =>
  Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
    : '—'

/** What a contract charges, as one figure or the span of its fees. */
function feeRange(group) {
  const values = group.fees.map((fee) => fee.value).filter((v) => v != null)
  if (values.length === 0) return '—'
  const show = (value) =>
    group.fees[0].unit === 'permille'
      ? `${value / 10}%`
      : `${number(value / 1_000_000, 6)} ꜩ`
  const low = Math.min(...values)
  const high = Math.max(...values)
  return low === high ? show(low) : `${show(low)} – ${show(high)}`
}

/** A bordered label/value table, as the fees are listed. */
function Rows({ children }) {
  return <ul className={styles.kv}>{children}</ul>
}

function Row({ label, children }) {
  return (
    <li className={styles.kv_row}>
      <span className={styles.kv_label}>{label}</span>
      <span className={styles.kv_value}>{children}</span>
    </li>
  )
}

export default function DaoParameters() {
  // Get all the required DAO information
  const [daoStorage] = useStorage(DAO_GOVERNANCE_CONTRACT)
  const [governanceParameters] = useDaoGovernanceParameters(daoStorage)
  const [proposals] = useDaoProposals(daoStorage)
  const [representatives] = useDaoRepresentatives(daoStorage)
  const [daoMemberCount] = useDaoMemberCount(0)
  const [daoBalance] = useBalance(DAO_TREASURY_CONTRACT)
  const [daoTokenBalance] = useDaoTokenBalance(DAO_TREASURY_CONTRACT)

  // The core team's own contract, and what Teia charges.
  const multisig = useMultisigProposals()
  const { groups } = useTeiaFees()
  const { token } = useDaoToken()

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

  const all = Object.values(proposals)
  const count = (key) => all.filter((p) => p.status[key]).length
  const votesCast = userVotes ? Object.keys(userVotes).length : 0
  const votesAsRepresentative = userCommunityVotes
    ? Object.keys(userCommunityVotes).length
    : 0
  const submitted = all.filter((p) => p.issuer === userAddress).length
  const escrow = gp.escrow_amount / DAO_TOKEN_DECIMALS
  const minimum = gp.min_amount / DAO_TOKEN_DECIMALS

  const byStatus = (status) =>
    multisig.proposals.filter((p) => p.status === status).length
  const marketplaceFee = groups
    .find((group) => group.key === 'marketplace')
    ?.fees.find((fee) => fee.unit === 'permille')

  return (
    <>
      <section className={styles.section}>
        <Rows>
          <Row label="TEIA holders">{number(daoMemberCount)}</Row>
          <Row label="Treasury">
            {number(daoBalance)} {'ꜩ'} · {number(daoTokenBalance)} TEIA
          </Row>
          <Row label="DAO proposals">
            {number(all.length)} · {count('open')} open
          </Row>
          <Row label="Core team">
            {number(multisig.memberCount)} members · {multisig.quorum ?? '—'}{' '}
            votes to pass
          </Row>
          <Row label="Multisig proposals">
            {number(multisig.proposals.length)} · {byStatus('active')} active
          </Row>
          <Row label="Marketplace fee">
            {marketplaceFee ? `${marketplaceFee.value / 10}%` : '—'}
          </Row>
        </Rows>
      </section>

      {userAddress && (
        <>
          <Line />
          <section className={styles.section}>
            <h1 className={styles.section_title}>You</h1>
            <Rows>
              <Row label="Address">
                <TeiaUserLink address={userAddress} shorten />
              </Row>
              <Row label="TEIA held">{number(userTokenBalance, 1)}</Row>
              <Row label="Proposals submitted">{submitted}</Row>
              <Row label="Proposals voted on">{votesCast}</Row>
              {userCommunity && (
                <Row label={`Representative for ${userCommunity}`}>
                  {votesAsRepresentative} voted on
                </Row>
              )}
            </Rows>
          </section>
        </>
      )}

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Governance</h1>
        <p className={styles.dao_intro}>
          Changed only by a DAO vote. Proposals are under{' '}
          <Link to="/dao/proposals">DAO Proposals</Link>.
        </p>
        <Rows>
          <Row label="Vote method">
            {gp.vote_method.linear ? 'Linear weight' : 'Quadratic weight'}
          </Row>
          <Row label="Quorum">
            {number(daoStorage.quorum / voteScaling)} weighted votes
          </Row>
          <Row label="Supermajority">{gp.supermajority}% in favour</Row>
          <Row label="Voting period">{gp.vote_period} days</Row>
          <Row label="Waiting period">{gp.wait_period} days</Row>
          <Row label="Escrow to propose">
            {escrow > 0 ? `${number(escrow, 2)} TEIA` : 'None'}
          </Row>
          <Row label="Minimum to vote">
            {/* A hundredth of a token is no threshold worth printing. */}
            {minimum >= 0.01 ? `${number(minimum, 2)} TEIA` : 'Any amount'}
          </Row>
          <Row label="Proposals executed">{count('executed')}</Row>
          <Row label="Proposals rejected">
            {count('rejected')} · {count('cancelled')} cancelled
          </Row>
        </Rows>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Core team multisig</h1>
        <p className={styles.dao_intro}>
          Day-to-day operations, within the mandate the DAO sets.{' '}
          <Link to="/dao/multisig">Multisig Proposals</Link>.
        </p>
        <Rows>
          <Row label="Members">{number(multisig.memberCount)}</Row>
          <Row label="Votes to pass">{multisig.quorum ?? '—'}</Row>
          <Row label="Time to vote">{multisig.expirationDays ?? '—'} days</Row>
          <Row label="Active proposals">{byStatus('active')}</Row>
          <Row label="Executed">
            {byStatus('executed')} · {byStatus('expired')} expired
          </Row>
          <Row label="Contract">
            <TezosAddressLink address={DAO_TREASURY_CONTRACT} shorten />
          </Row>
        </Rows>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Fees</h1>
        <p className={styles.dao_intro}>
          All of it goes to the treasury. Every fee is listed under{' '}
          <Link to="/dao/fees">Fees</Link>.
        </p>
        <Rows>
          {groups.map((group) => (
            <Row key={group.key} label={group.name}>
              {feeRange(group)}
            </Row>
          ))}
        </Rows>
      </section>

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>TEIA token</h1>
        <Rows>
          <Row label="Holders">
            <TzktLink link={`${DAO_TOKEN_CONTRACT}/tokens/0/holders`}>
              {number(daoMemberCount)}
            </TzktLink>
          </Row>
          <Row label="Total supply">{number(token?.supply)} TEIA</Row>
          <Row label="Transfers">{number(token?.transfers)}</Row>
          <Row label="Contract">
            <TezosAddressLink address={daoStorage.token} shorten />
          </Row>
          <Row label="Buy or sell">
            <a href={QUIPUSWAP_TEIA_URL} target="_blank" rel="noreferrer">
              Quipuswap
            </a>
          </Row>
        </Rows>
        <div className={styles.donate}>
          <DonateInput destinationAddress={daoStorage.treasury} />
        </div>
      </section>

      <Line />

      <TokenHolders limit={10} title="Top 10 token holders" />

      <Line />

      <section className={styles.section}>
        <h1 className={styles.section_title}>Contracts</h1>
        <Rows>
          <Row label="Governance">
            <TezosAddressLink address={DAO_GOVERNANCE_CONTRACT} shorten />
          </Row>
          <Row label="Token">
            <TezosAddressLink address={daoStorage.token} shorten />
          </Row>
          <Row label="DAO treasury">
            <TezosAddressLink address={daoStorage.treasury} shorten />
          </Row>
          <Row label="Core team multisig">
            <TezosAddressLink address={DAO_TREASURY_CONTRACT} shorten />
          </Row>
          <Row label="Guardians">
            <TezosAddressLink address={daoStorage.guardians} shorten />
          </Row>
          <Row label="Administrator">
            <TezosAddressLink address={daoStorage.administrator} shorten />
          </Row>
          <Row label="Representatives">
            <TezosAddressLink address={daoStorage.representatives} shorten />
          </Row>
        </Rows>
      </section>

      <Line />

      <section className={styles.aside}>
        <div>
          <h2 className={styles.aside_title}>Community representatives</h2>
          <p className={styles.aside_text}>
            A holder can entrust their vote to a representative instead of
            voting themselves.
          </p>
          <ul className={styles.aside_list}>
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
        </div>

        <div>
          <h2 className={styles.aside_title}>Polls</h2>
          <p className={styles.aside_text}>
            Feature requests, feedback and community sentiment, outside the DAO
            process. <Link to="/polls">Teia polls</Link>.
          </p>
          <h2 className={styles.aside_title}>Reading</h2>
          <p className={styles.aside_text}>
            <a
              href="https://github.com/teia-community/teia-docs/wiki/Governance-on-Teia"
              target="_blank"
              rel="noopener noreferrer"
            >
              Governance on Teia
            </a>
            {' · '}
            <a
              href="https://blog.teia.art/blog/dao-test-launch"
              target="_blank"
              rel="noopener noreferrer"
            >
              The DAO launch
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
