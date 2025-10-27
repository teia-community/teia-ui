import { Page } from '@atoms/layout'
import { Line } from '@atoms/line'
import { DAO_TREASURY_CONTRACT } from '@constants'
import { TopDonors } from '@components/dao/TopDonors'
import { FountainDonors } from '@components/dao/FountainDonors'
import DonateButton from '@atoms/button/DonateButton'
import FountainDonateButton from '@atoms/button/FountainDonateButton'
import styles from '@style'
import { Link } from 'react-router-dom'

export function Donate() {
  return (
    <Page title="Donate">
      <section className={styles.section}>
        <h1 className={styles.section_title}>Support the TEIA Community!</h1>
        <p>
          Starting in 2025, TEIA has started to accept direct donations from the
          public in order to help pay for operating and maintenance costs to
          keep the site alive and running. The funds that go over operation
          budgets will be put towards events, marketing, feature building, and
          bounty prizes to improve community resources and practices as a whole.
        </p>
        <p>
          All allocation of funds must reach quorum by the TEIA core team
          through a multisig vote. (No exceptions, except in cases of the direct
          intervention by the DAO token holders themselves, which must also
          reach quorum.) For records of previous budget cycles and proposals,
          look at the{' '}
          <a
            href="https://core-team-multisig.onrender.com/proposals/"
            target="_blank"
            rel="noreferrer"
          >
            multisig page
          </a>{' '}
          and <Link to="/dao">DAO</Link> pages for more details.
        </p>
      </section>

      <Line />

      <DonateButton />

      <Line />

      <TopDonors contractAddress={DAO_TREASURY_CONTRACT} limit={10} />

      <Line />

      <FountainDonateButton />

      <Line />

      <FountainDonors limit={10} />
    </Page>
  )
}
