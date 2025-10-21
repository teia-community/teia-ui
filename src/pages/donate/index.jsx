import { Page } from '@atoms/layout'
import { Line } from '@atoms/line'
import { DAO_TREASURY_CONTRACT } from '@constants'
import { TopDonors } from '@components/dao/TopDonors'
import { FountainDonors } from '@components/dao/FountainDonors'
import styles from '@style'

export function Donate() {
  return (
    <Page title="Donate">
      <section className={styles.section}>
        <h1 className={styles.section_title}>Support TEIA</h1>
        <p>Some text</p>
      </section>

      <Line />

      <TopDonors contractAddress={DAO_TREASURY_CONTRACT} limit={10} />

      <Line />

      <FountainDonors limit={10} />
    </Page>
  )
}
