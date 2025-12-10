import { Page } from '@atoms/layout'
import styles from '@style'
import { ReactComponent as CodeOfConductMD } from '../../lang/en/codeofconduct.md'

export function CodeOfConduct() {
  return (
    <Page title="codeofconduct">
      <div className={styles.codeofconduct}>
        <CodeOfConductMD />
      </div>
    </Page>
  )
}
