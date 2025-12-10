import { Page } from '@atoms/layout'
import styles from '@style'
import { ReactComponent as CoreValuesMD } from '../../lang/en/corevalues.md'

export function CoreValues() {
  return (
    <Page title="corevalues">
      <div className={styles.corevalues}>
        <CoreValuesMD />
      </div>
    </Page>
  )
}
