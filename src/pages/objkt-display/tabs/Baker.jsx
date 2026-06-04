import { Link } from 'react-router-dom'
import { Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { walletPreview } from '@utils/string'
import { useAccountDelegate } from '@data/swr'
import BakerOverview from '@components/baker/BakerOverview'
import { useObjktDisplayContext } from '..'
import styles from './Baker.module.scss'

export const Baker = () => {
  /** @type {{nft:import('@types').NFT}} */
  const { nft } = useObjktDisplayContext()
  const artistAddress = nft.artist_address

  const [delegate] = useAccountDelegate(artistAddress)

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

  return (
    <Container>
      <div className={styles.tab}>
        <div className={styles.topRow}>
          <p className={styles.intro}>
            This is the baker that the artist is currently delegated to. Bakers
            help to secure the network and vote on essential upgrades that keep
            the Tezos ecosystem running. To learn more,{' '}
            <Link to="/bakers">click here</Link>.
          </p>
          <div className={styles.overviewCol}>
            <BakerOverview
              address={delegate.address}
              alias={delegate.alias}
              addressTo={`/baker/${delegate.address}`}
            />
          </div>
        </div>
        <p className={styles.note}>Data from TzKT.</p>
      </div>
    </Container>
  )
}
