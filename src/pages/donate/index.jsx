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

      <section className={styles.section}>
        <p>
          TEIA and its DAO is an officially registered non-profit, operating
          under the entity name, TEIA DAO LLC. TEIA Token holders have a say in
          the non-profit organization's direction and organizational efforts as
          "operating members" of the LLC. (If you have any questions about how
          the DAO's legal structure works, please contact us through{' '}
          <a
            href="https://discord.gg/fxfAh8tf5U"
            target="_blank"
            rel="noreferrer"
          >
            TEIA's Discord Server
          </a>
          .)
        </p>
      </section>

      <Line />

      <section className={styles.section}>
        <h2 className={styles.section_title}>Teia Fountain</h2>
        <p>
          The Teia Fountain is a community funded place for new artists to apply
          to and receive a small amount of XTZ for the purposes of minting their
          work. This amount covers the nominal minting fees, storage and
          transaction fees, as well as the swapping fees to list works for sale
          on the marketplace website. Some artists have income barriers or other
          barriers to accessing XTZ, or who are curious about how it all works
          and want to explore the ecosystem before buying XTZ for themselves.
          The fountain serves as a way for artists to get their start in our
          ecosystem!
        </p>
        <p>
          Register your Alias on{' '}
          <a href="https://teia.art" target="_blank" rel="noreferrer">
            teia.art
          </a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.section_title}>⛲ Applying as an Artist</h2>
        <p>
          Are you an artist who needs tez but can't get it? You can request a
          volunteer from the community to sponsor you in the #fountain channel
          on Discord. Please fill out{' '}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScUYFFw2eUXX64RHOPwUD1LZ8hD4qaiGRpOg-Su1El-W2OXGQ/viewform"
            target="_blank"
            rel="noreferrer"
          >
            this form
          </a>{' '}
          to get started! After filling out the form, please send us a message
          in{' '}
          <a
            href="https://discord.gg/ZuMrJcjnSW"
            target="_blank"
            rel="noreferrer"
          >
            the #fountain channel in the Teia Discord
          </a>{' '}
          saying that you filled out the form.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.section_title}>⛲ Volunteering as a Sponsor</h2>
        <p>
          If you would like to support new artists by subsidizing their minting
          costs, you can send XTZ donations to the fountain multisig address:{' '}
          <a
            href="https://tzkt.io/KT1EsvmkijLKPQmcJMbjDeKRXdwky1LWvwpG/operations/"
            target="_blank"
            rel="noreferrer"
          >
            KT1EsvmkijLKPQmcJMbjDeKRXdwky1LWvwpG
          </a>
          . Please do not send NFT's to this multig address, only XTZ, which can
          be done directly or through a beneficiary contract that is set up when
          minting which allows sales to be automatically split and redirected to
          the multisig. Currently the fountain initiative is being run by{' '}
          <a
            href="https://teia.art/tz/tz1WJpBDRGfa21un4yQDKTGXZw561nsGg7Qe"
            target="_blank"
            rel="noreferrer"
          >
            scott
          </a>{' '}
          - if you have any questions, ask in Discord for more details!
          [Instructions above written by{' '}
          <a
            href="https://teia.art/malicioussheep"
            target="_blank"
            rel="noreferrer"
          >
            malicioussheep
          </a>{' '}
          and{' '}
          <a
            href="https://teia.art/merchant_coppola"
            target="_blank"
            rel="noreferrer"
          >
            merchant_coppola
          </a>
          .]
        </p>
      </section>

      <Line />

      <FountainDonateButton />

      <Line />

      <FountainDonors limit={10} />
    </Page>
  )
}
