import { Page } from '@atoms/layout'
import styles from '@style'
import { DEFAULT_DESCRIPTION } from '@utils/page-meta.mjs'
import { ReactComponent as AboutMD } from '../../lang/en/about.md'

export function About() {
  return (
    <Page title="about" description={DEFAULT_DESCRIPTION}>
      <div className={styles.about}>
        <AboutMD />
      </div>
    </Page>
  )
}
