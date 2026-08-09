import { Page, Container } from '@atoms/layout'
import Button from '@atoms/button/Button'
import { Loading } from '@atoms/loading'
import { PATH } from '@constants'
import { useCurations, useCurationRoles } from '@data/curations'
import { useUserStore } from '@context/userStore'
import CurationGrid from './CurationGrid'
import styles from '@style'

export default function CurationsHome() {
  const { data, error } = useCurations()
  const address = useUserStore((st) => st.address)
  const { data: roles } = useCurationRoles(address)

  const curations = (data ?? []).filter((c) => !c.hidden)

  return (
    <Page title="Curations">
      <Container>
        <div className={styles.header}>
          <h1>Curations</h1>
          {roles?.canCreate && (
            <Button shadow_box to={`${PATH.CURATIONS}/create`}>
              New curation
            </Button>
          )}
        </div>

        {error && <p className={styles.empty}>Could not load curations.</p>}

        {!data && !error && <Loading message="Loading curations" />}

        {data && (
          <CurationGrid
            curations={curations}
            emptyMessage="No curations yet."
          />
        )}
      </Container>
    </Page>
  )
}
