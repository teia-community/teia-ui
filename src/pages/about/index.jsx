import { Page } from '@atoms/layout'
import styles from '@style'
import { ReactComponent as AboutMD } from '../../lang/en/about.md'

export function About() {
  return (
    <Page title="about">
      <div className={styles.about}>
        <AboutMD />
      </div>
    </Page>
  )
}
