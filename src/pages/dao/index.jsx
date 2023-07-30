import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import styles from '@style'

export const DAO = () => {

  const claimTokens = useUserStore((st) => st.claimTokens)

  return (
    <Page title="Claim DAO tokens" large>
      <div className={styles.dao__container}>
        <section className={styles.dao__section}>
          <h1 className={styles.dao__section__title}>
            Welcome to the TEIA token claim page!
          </h1>

          <p>
            Here you can claim your TEIA DAO tokens.
          </p>

          <p>
            If your Tezos wallet satisfies the conditions laid out in the token
            distribution fact sheet you are eligible to claim your Teia tokens.
            You can find a table with all eligible Tezos
            addresses <a href="https://docs.google.com/spreadsheets/d/1p301FDxAyi2EI-RjSyH5Fv34OGJ4j7vdvc5EQJ3lf54/edit?usp=sharing">here</a>.
          </p>

          <p>
            TEIA DAO tokens, or TEIA tokens, are specifically designed for
            governance purposes within the Teia DAO ecosystem. By owning TEIA
            tokens, you are part of the Teia DAO LLC and eligible to put
            forward and vote on DAO proposals for Teia.
          </p>

          <p>
            TEIA tokens are not intended to be securities or investment
            instruments and Teia as a non-profit organisation is not allowed
            and does not intend to generate and distribute profits based on
            token ownership.
          </p> 

          <p> 
            Please note that the distribution and use of TEIA tokens may be
            subject to various laws and regulations in different jurisdictions.
            It is your responsibility to ensure compliance with applicable laws
            before participating in the token claim process.
          </p>
        </section>

        <Line />

        <section className={styles.dao__section}>
          <h1 className={styles.dao__section__title}>
            How to Claim your Tokens
          </h1>

          <ol>
            <li>
              <b>Sync your wallet</b> in the top right corner of this page.
            </li>

            <li>
              <b>Confirm you have read the legal disclaimer.</b> Before
              proceeding with the token claim process, please make sure
              you have read and understood the legal disclaimer provided on
              this page. It outlines important information regarding the nature
              of TEIA tokens and your responsibilities as a token holder.
            </li>

            <li>
              <b>Claim tokens.</b> Once you have synced your wallet and
              acknowledged the legal
              disclaimer below, click on the "Claim DAO tokens" button below to
              initiate the token claim process.
            </li>
          </ol>

          <p>
            For any questions or assistance regarding the token claim process,
            please contact us via discord or mail
            at <a href="mailto:info@teia.art">info@teia.art</a>
          </p>

          <p>
            By clicking this button, you confirm that you have read and agree
            with the legal disclaimer below.
          </p>

          <Button shadow_box onClick={claimTokens}>Claim DAO tokens</Button>
        </section>

        <Line />

        <section className={styles.dao__section}>
          <h1 className={styles.dao__section__title}>
            Legal Disclaimer
          </h1>

          <p>
            Please read the following disclaimer carefully before participating
            in the TEIA token claim process. By claiming your TEIA DAO tokens,
            you agree to be bound by the terms and conditions set forth in this
            disclaimer. If you do not agree with any part of this disclaimer,
            you should refrain from using this claim page.
          </p>

          <ol>
            <li>
              <b>Token governance only:</b> The TEIA DAO tokens ("TEIA tokens")
              distributed through the claim page are intended solely for
              governance purposes within the TEIA DAO ecosystem. TEIA tokens do
              not represent or confer any equity interests or any form of
              investment in the Teia DAO or any associated entity. TEIA tokens
              are not intended to be securities or investment assets. Teia does
              not intend to generate and distribute profits among its members.
              Teia does not sell TEIA tokens, nor to generate profit with the
              tokens. Claiming TEIA tokens via this official claim page is
              free.&nbsp;
            </li>

            <li>
              <b>No investment advice:</b> The information provided on the
              claim page, including but not limited to any articles, blog posts
              on blog.teai.art, or other related materials, is for
              informational purposes only. It does not constitute investment
              advice or any form of recommendation. The Teia DAO team does not
              endorse or recommend the purchase or sale of TEIA tokens as
              investment assets.&nbsp; The Teia DAO team makes no guarantees or
              representations regarding the future value, utility, or
              performance of TEIA tokens. The value of TEIA tokens may
              fluctuate, and you may experience losses if you choose to acquire
              or trade them. The Teia DAO team disclaims any responsibility for
              such losses.
            </li>

            <li>
              <b>DAO membership:</b> By claiming and/or holding TEIA tokens,
              you become a member of the Teia DAO LLC. Teia does not require
              you to provide any personal information, as long as you hold less
              than 10% of tokens in circulation. Every address is limited to
              400k TEIA tokens.
            </li>

            <li>
              <b>Regulatory compliance:</b> The distribution and use of TEIA
              tokens may be subject to various laws, regulations, and
              restrictions in different jurisdictions. It is your sole
              responsibility to ensure compliance with any applicable laws and
              regulations before participating in the TEIA token claim process.
              The TEIA DAO team does not provide legal, regulatory, or tax
              advice.
            </li>

            <li>
              <b>No liability:</b> To the maximum extent permitted by
              applicable law, the TEIA DAO team, its contributors, affiliates,
              partners, and any other associated entities shall not be liable
              for any direct, indirect, incidental, consequential, or punitive
              damages arising out of or in connection with the TEIA tokens,
              the claim page, or your participation in the TEIA token claim
              process.
            </li>

            <li>
              <b>Risk acknowledgement:</b> By participating in the TEIA token
              claim process, you acknowledge and assume the risks associated
              with blockchain technology, cryptocurrencies, and the volatility
              of the cryptocurrency market. You agree to hold the TEIA DAO team
              harmless against any claims, demands, actions, or liabilities
              arising from your participation.
            </li>

            <li>
              <b>No endorsement:</b> The inclusion of any third-party links or
              references on the claim page does not imply endorsement,
              approval, or responsibility by the TEIA DAO team. The TEIA DAO
              team does not control or guarantee the accuracy, relevance,
              timeliness, or completeness of any third-party content.
            </li>

            <li>
              <b>Updates and amendments:</b> The TEIA DAO team reserves the
              right to modify, update, or amend this disclaimer at any time
              without prior notice. Your continued use of the claim page
              following any such modifications constitutes your acceptance of
              the revised disclaimer.
            </li>
          </ol>
        </section>
      </div>
    </Page>
  )
}
