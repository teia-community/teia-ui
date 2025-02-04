import { Page } from '@atoms/layout'
import styles from '@style'
import { ReactComponent as TermsMD } from '../../lang/en/terms.md'

export function Terms() {
  return (
    <Page title="terms">
      <div className={styles.terms}>
        <TermsMD />
      </div>
    </Page>
  )
}
