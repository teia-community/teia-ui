import { Link } from 'react-router-dom'
import Identicon from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { useBakerInfo } from '@data/swr'
import { TZKT_AVATARS_URL } from '@constants'
import styles from './BakerOverview.module.scss'

const fmtXTZ = (mutez) =>
  typeof mutez === 'number'
    ? `${Math.round(mutez / 1000000).toLocaleString()} ꜩ`
    : '—'

// edgeOfBakingOverStaking is expressed in billionths (1e9 = 100%)
const fmtPct = (edge) =>
  typeof edge === 'number' ? `${((edge / 1e9) * 100).toFixed(2)}%` : '—'

// limitOfStakingOverBaking is expressed in millionths
const fmtMult = (limit) =>
  typeof limit === 'number' ? `${Math.round(limit / 1e6)}×` : '—'

function Stat({ label, children }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{children}</span>
    </div>
  )
}

/**
 * Shared baker header (avatar + name + address) and stat-card grid.
 * @param {string} address baker's tz address
 * @param {string} [alias] baker's display name
 * @param {string} [addressTo] if set, the address line is an internal link to
 *   this route; otherwise it is an external tzkt.io link
 * @param {boolean} [extended] show the full stat set (used on the baker page)
 */
export default function BakerOverview({
  address,
  alias,
  addressTo,
  extended = false,
}) {
  const [info] = useBakerInfo(address)
  const name = alias || walletPreview(address)

  return (
    <div className={styles.overview}>
      <div className={styles.header}>
        <Identicon
          address={address}
          logo={`${TZKT_AVATARS_URL}/${address}`}
          className={styles.avatar}
        />
        <div className={styles.headerText}>
          <h3 className={styles.name}>{name}</h3>
          {addressTo ? (
            <Link className={styles.address} to={addressTo}>
              {walletPreview(address)}
            </Link>
          ) : (
            <a
              className={styles.address}
              href={`https://tzkt.io/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {walletPreview(address)} ↗
            </a>
          )}
        </div>
      </div>

      <div className={styles.stats}>
        <Stat label="Balance">{fmtXTZ(info?.balance)}</Stat>
        <Stat label="Staking balance">{fmtXTZ(info?.stakingBalance)}</Stat>
        <Stat label="Delegated">{fmtXTZ(info?.delegatedBalance)}</Stat>
        <Stat label="Delegators">{info?.numDelegators ?? '—'}</Stat>
        {extended && (
          <>
            <Stat label="Stakers">{info?.stakersCount ?? '—'}</Stat>
            <Stat label="Baking power">{fmtXTZ(info?.bakingPower)}</Stat>
            <Stat label="Voting power">{fmtXTZ(info?.votingPower)}</Stat>
            <Stat label="Staked (own)">{fmtXTZ(info?.stakedBalance)}</Stat>
            <Stat label="Staked (external)">
              {fmtXTZ(info?.externalStakedBalance)}
            </Stat>
            <Stat label="Total staked">{fmtXTZ(info?.totalStakedBalance)}</Stat>
            <Stat label="Staking edge">
              {fmtPct(info?.edgeOfBakingOverStaking)}
            </Stat>
            <Stat label="Reserve multiplier">
              {fmtMult(info?.limitOfStakingOverBaking)}
            </Stat>
          </>
        )}
      </div>
    </div>
  )
}
