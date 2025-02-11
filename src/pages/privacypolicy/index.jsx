import { Page } from '@atoms/layout'
import styles from '@style'
import { ReactComponent as PrivacyPolicyMD } from '../../lang/en/privacypolicy.md'

export function PrivacyPolicy() {
  return (
    <Page title="privacypolicy">
      <div className={styles.privacypolicy}>
        <PrivacyPolicyMD />
      </div>
    </Page>
  )
}
