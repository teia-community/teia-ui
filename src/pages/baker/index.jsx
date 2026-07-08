import { useParams, Link } from 'react-router-dom'
import { Page, Container } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useAccount } from '@data/swr'
import BakerOverview from '@components/baker/BakerOverview'
import BakerServiceCards from '@components/baker/BakerServiceCards'
import BakerDelegators from '@components/baker/BakerDelegators'
import styles from './Baker.module.scss'

export default function BakerPage() {
  const { address } = useParams()
  const [account] = useAccount(address)

  if (account === undefined) {
    return (
      <Page>
        <Container>
          <Loading message="Loading baker..." />
        </Container>
      </Page>
    )
  }

  if (account?.type !== 'delegate') {
    return (
      <Page>
        <Container>
          <div className={styles.notBaker}>
            <p>This account is not a baker.</p>
            <Link to={`/tz/${address}`}>View profile</Link>
          </div>
        </Container>
      </Page>
    )
  }

  return (
    <Page>
      <Container>
        <div className={styles.page}>
          <Link to="/bakers" className={styles.backLink}>
            ← All bakers
          </Link>

          {account.active === false && (
            <p className={styles.inactive}>
              ⚠️ This baker is currently inactive.
            </p>
          )}

          <BakerOverview address={address} alias={account.alias} extended />

          <BakerServiceCards address={address} />

          <BakerDelegators address={address} total={account.numDelegators} />

          <p className={styles.note}>Data from TzKT.</p>
        </div>
      </Container>
    </Page>
  )
}
