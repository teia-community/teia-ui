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
        <BakerOverview
          address={delegate.address}
          alias={delegate.alias}
          addressTo={`/baker/${delegate.address}`}
        />
        <p className={styles.note}>Data from TzKT.</p>
      </div>
    </Container>
  )
}
