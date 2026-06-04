import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import Identicon from '@atoms/identicons'
import { walletPreview } from '@utils/string'
import { useAccountDelegate, useBakerInfo } from '@data/swr'
import { useObjktDisplayContext } from '..'
import styles from './Baker.module.scss'

const fmtXTZ = (mutez) =>
  typeof mutez === 'number'
    ? `${Math.round(mutez / 1000000).toLocaleString()} ꜩ`
    : '—'

function Stat({ label, children }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{children}</span>
    </div>
  )
}

export const Baker = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft } = useObjktDisplayContext()
  const artistAddress = nft.artist_address

  const [delegate] = useAccountDelegate(artistAddress)
  const bakerAddress =
    delegate && delegate.active !== false ? delegate.address : null
  const [info] = useBakerInfo(bakerAddress)

  // delegate is `undefined` while loading, `null` once we know there is none
  if (delegate === undefined) {
    return (
      <Container>
        <Loading message="Loading baker..." />
      </Container>
    )
  }

  if (!delegate) {
    return (
      <Container>
        <p className={styles.state}>Not delegated</p>
      </Container>
    )
  }

  if (delegate.active === false) {
    return (
      <Container>
        <div className={styles.tab}>
          <p className={styles.state}>Inactive baker</p>
          <p className={styles.state}>
            {delegate.alias || walletPreview(delegate.address)}
          </p>
        </div>
      </Container>
    )
  }

  const name = delegate.alias || walletPreview(delegate.address)

  return (
    <Container>
      <div className={styles.tab}>
        <div className={styles.header}>
          <Identicon
            address={delegate.address}
            logo={`https://services.tzkt.io/v1/avatars/${delegate.address}`}
            className={styles.avatar}
          />
          <div className={styles.headerText}>
            <h3 className={styles.name}>{name}</h3>
            <a
              className={styles.address}
              href={`https://tzkt.io/${delegate.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {walletPreview(delegate.address)}
            </a>
          </div>
        </div>

        <div className={styles.stats}>
          <Stat label="Balance">{fmtXTZ(info?.balance)}</Stat>
          <Stat label="Staking balance">{fmtXTZ(info?.stakingBalance)}</Stat>
          <Stat label="Delegated">{fmtXTZ(info?.delegatedBalance)}</Stat>
          <Stat label="Delegators">
            {info?.delegatorsCount ?? info?.numDelegators ?? '—'}
          </Stat>
        </div>

        <p className={styles.note}>Data from TzKT.</p>
      </div>
    </Container>
  )
}
