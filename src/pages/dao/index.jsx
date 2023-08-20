import { useState } from 'react'
import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { Button } from '@atoms/button'
import { Checkbox } from '@atoms/input'
import { Line } from '@atoms/line'
import styles from '@style'
import { DAOIcon } from '@icons'

export const DAO = () => {
  const claimTokens = useUserStore((st) => st.claimTokens)
  const [acceptLegalDisclaimer, setAcceptLegalDisclaimer] = useState(false)

  return (
    <Page title="Claim DAO tokens" large>
      <div className={styles.container}>
        <section className={styles.section}>
          <div className={styles.headline}>
            <h1>Welcome to the TEIA tokens claim page!</h1>
            <p>Here you can claim your Teia DAO tokens.</p>
            <DAOIcon />
          </div>
          <p>
            By owning TEIA tokens, you are part of the Teia DAO LLC and eligible
            to put forward and vote on DAO proposals for Teia. 
            Teia DAO tokens, (or "TEIA tokens") are specifically designed and intended for
            governance purposes within the Teia DAO ecosystem.
          </p>

          <p>
            If your Tezos wallet satisfies the conditions laid out in the{' '}
            <a
              href="https://blog.teia.art/blog/fact-sheet-token-drop"
              target="_blank"
              rel="noreferrer"
            >
              token distribution fact sheet
            </a>{' '}
            you are eligible to claim your TEIA tokens during the claiming
            period (August 20th, 2023 to November 20th, 2023) You can find a
            table with all eligible Tezos addresses and the amount of tokens in
            this{' '}
            <a
              href="https://docs.google.com/spreadsheets/d/11jFANEUsvNSc9vQGD7sc46n_BOp8v0tGOLY1LG0KENk/edit?usp=sharing"
              target="_blank"
              rel="noreferrer"
            >
              token distribution spreadsheet
            </a>
            .
          </p>

          <p>
            For any questions or assistance regarding the token claim process
            get in touch with the team via discord or mail at{' '}
            <a href="mailto:info@teia.art">info@teia.art</a>
          </p>
        </section>

        <Line />

        <section className={styles.section}>
          <h1 className={styles.section_title}>How to Claim your Tokens</h1>

          <ol>
            <li counter="1">
              <b>Sync your wallet</b> with teia.art (top right corner). Please
              check the URL before syncing your wallet: The only official TEIA
              token claim page is at{' '}
              <a href="www.teia.art/dao">www.teia.art/dao</a>
            </li>

            <li counter="2">
              <b>Read the legal disclaimer below</b> It outlines important
              information regarding the nature of TEIA tokens and your
              responsibilities as a token holder.
            </li>

            <li counter="3">
              <b>Confirm you have read the disclaimer</b> by checking the box at
              the bottom of this page to get access to the claim button.
            </li>
            <li counter="4">
              <b>Click on the "Claim TEIA DAO tokens" button</b> at the bottom
              of the of this page to initiate the token claim process and
              confirm the operation with your wallet. Your tokens should arrive
              in your wallet after a few minutes.
            </li>
          </ol>

          <p>
            If you own multiple eligible wallets, unsync your wallet and repeat
            these steps for each of your wallets.
          </p>
        </section>

        <Line />

        <section className={styles.section}>
          <h1 className={styles.section_title}>Legal Disclaimer</h1>

          <p>
            By claiming your Teia DAO tokens ("TEIA tokens"), you agree to be bound by the terms
            and conditions set forth in this disclaimer. If you do not agree
            with any part of this disclaimer, don't participate in the token
            claim process!
          </p>

          <ol>
            <li counter="1">
              <b>Governance only:</b> The TEIA tokens are intended solely for
              governance purposes within the Teia DAO ecosystem. TEIA tokens do
              not represent any form of investment in the Teia DAO or any
              associated entity. TEIA tokens are not intended to be securities
              or investment assets. The Teia DAO LLC does not intend to generate and
              distribute profits among its members. Teia does not sell TEIA
              tokens, nor to generate profit with the tokens. Claiming TEIA
              tokens via this claim page is free.
            </li>

            <li counter="2">
              <b>No investment advice:</b> The information provided on the claim
              page bor any articles, blog posts on blog.teia.art, or other related materials
              published by Teia DAO LLC, is for informational
              purposes only. It does not constitute investment advice or any
              form of recommendation. The Teia DAO team does not endorse or
              recommend the purchase or sale of TEIA tokens as investment
              assets. The Teia DAO team makes no guarantees or representations
              regarding the future value, utility, or performance of TEIA
              tokens. The value of TEIA tokens may fluctuate, and you may
              experience losses if you choose to acquire or trade them. The Teia
              DAO team disclaims any responsibility for such losses.
            </li>

            <li counter="3">
              <b>DAO membership:</b> By claiming and/or holding TEIA tokens, you
              become a member of the Teia DAO LLC. Teia does not require you to
              provide any personal information, as long as you hold less than
              10% of tokens in circulation. Every address is limited to 400k
              TEIA tokens (5% of total supply) initially. This limit can be adjusted between 
              1% and 10% of total supply via DAO vote. If you want to stop
              being a Teia DAO member, you can send all your TEIA tokens to the{' '}
              <a href="https://tzkt.io/KT1J9FYz29RBQi1oGLw8uXyACrzXzV1dHuvb/operations/">
                Teia Treasury Address
              </a>
              .
            </li>

            <li counter="4">
              <b>Regulatory compliance:</b> The distribution and use of TEIA
              tokens may be subject to various laws, regulations, and
              restrictions in different jurisdictions. It is your sole
              responsibility to ensure compliance with any applicable laws and
              regulations before participating in the TEIA token claim process.
              The Teia DAO team does not provide legal, regulatory, or tax
              advice.
            </li>

            <li counter="5">
              <b>No liability:</b> To the maximum extent permitted by applicable
              law, the Teia DAO team, its contributors, affiliates, partners,
              and any other associated entities shall not be liable for any
              direct, indirect, incidental, consequential, or punitive damages
              arising out of or in connection with the TEIA tokens or your
              participation in the TEIA token claim process.
            </li>

            <li counter="6">
              <b>Risk acknowledgement:</b> By participating in the TEIA token
              claim process, you acknowledge and assume the risks associated
              with blockchain technology, cryptocurrencies, and the volatility
              of the cryptocurrency market. You agree to hold the Teia DAO team
              harmless against any claims, demands, actions, or liabilities
              arising from your participation.
            </li>

           <li counter="7">
             <b>Updates and amendments:</b> The Teia DAO team reserves the
             right to modify, update, or amend this disclaimer at any time
             without prior notice.
           </li>
            
          </ol>

          <br />
          <Checkbox
            alt={`click to ${
              acceptLegalDisclaimer ? 'decline' : 'accept'
            } the legal disclaimer`}
            checked={acceptLegalDisclaimer}
            onCheck={setAcceptLegalDisclaimer}
            label={
              'I have read and understood the legal disclaimer and agree to it'
            }
          />
          <i>
             You need to accept the disclaimer in order to access the token claim button.
          </i>
        </section>

        {acceptLegalDisclaimer && (
          <>
            <Line />
            <section className={styles.section}>
              <h1 className={styles.section_title}>Claim your TEIA tokens!</h1>

              <p>
                <Button shadow_box onClick={claimTokens}>
                  Claim TEIA tokens
                </Button>

              </p>
            </section>
          </>
        )}
      </div>
    </Page>
  )
}
