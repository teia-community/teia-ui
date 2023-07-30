import { Page } from '@atoms/layout'
import { useUserStore } from '@context/userStore'
import { Button } from '@atoms/button'
import { Line } from '@atoms/line'
import styles from '@style'

export const DAO = () => {

  const claimTokens = useUserStore((st) => st.claimTokens)

  return (
    <Page title="Claim DAO tokens" large>
      <div className={styles.dao__outer__container}>
        <h1 className={styles.dao__title}>Welcome to the TEIA Token Claim page!</h1>
      </div>

      <div className={styles.dao__outer__container}>
        <p> Here, you can claim your TEIA DAO tokens. If your Tezos wallet satisfies the conditions laid out in the token distribution fact sheet you are eligible to claim your Teia Tokens. You can find a Table with all eligible Tezos addresses here [add link]. 
        TEIA DAO tokens, or TEIA Tokens, are specifically designed for governance purposes within the Teia DAO ecosystem: By owning TEIA Tokens, you are part of the Teia DAO LLC and eligible to put forward and vote on DAO Proposals for Teia. 
        TEIA Tokens are not intended to be securities or investment instruments and Teia as a non-profit organisation is not allowed and does not intend to generate and distribute Profits based on Token ownership.
        Please note that the distribution and use of TEIA Tokens may be subject to various laws and regulations in different jurisdictions. It is your responsibility to ensure compliance with applicable laws before participating in the token claim process.
        </p>
      </div>

      <div className={styles.dao__outer__container}>
        <Line />
      </div>

      <div className={styles.dao__outer__container}>
        <h2 className={styles.dao__title}>How to Claim</h2>
        <ol>
        <li><b>Sync Your Wallet</b><span style="font-weight: 400;"> in the top right corner of this page</li>
        <li><b>Confirm you have read the Legal Disclaimer:</b> Before proceeding with the token claim process, please make sure you have read and understood the legal disclaimer provided on this page. It outlines important information regarding the nature of TEIA Tokens and your responsibilities as a token holder.</li>
        <li><b>Claim Tokens:</b>Once you have synced your wallet and acknowledged the legal disclaimer below, click on the "Claim Tokens" button below to initiate the token claim process.</li>
        </ol>
        <p> For any questions or assistance regarding the token claim process, please contact us via discord or mail at info@teia.art </p>
      </div>

      <div className={styles.dao__outer__container}>        
        <Button shadow_box onClick={claimTokens}>Claim DAO tokens</Button>
        <p><span style="font-weight: 400;">By clicking this button, you confiorm that you have read and agree with the legal disclaimer below</span></p>
      </div>
     
      </div>
        <div className={styles.dao__outer__container}>
        <Line />
      </div>
      
      <div className={styles.dao__outer__container}>
        <h2 className={styles.dao__title}>Legal Disclaimer</h2>
        <p><span style="font-weight: 400;">Please read the following disclaimer carefully before participating in the TEIA Token Claim process. By claiming your TEIA DAO tokens, you agree to be bound by the terms and conditions set forth in this disclaimer. If you do not agree with any part of this disclaimer, you should refrain from using this Claim Page.</span></p>
        <ol>
        <li><b>Token Governance Only:</b> The TEIA DAO tokens ("TEIA Tokens") distributed through the Claim Page are intended solely for governance purposes within the TEIA DAO ecosystem. TEIA Tokens do not represent or confer any equity interests or any form of investment in the Teia DAO or any associated entity. TEIA Tokens are not intended to be securities or investment assets. Teia does not intend to generate and distribute profits among its members. Teia does not sell TEIA Tokens, nor to generate profit with the Tokens. Claiming TEIA Tokens via this official claim page is free.&nbsp;</li>
        <li><b>No Investment Advice:</b> The information provided on the Claim Page, including but not limited to any articles, blog posts on blog.teai.art, or other related materials, is for informational purposes only. It does not constitute investment advice or any form of recommendation. The Teia DAO team does not endorse or recommend the purchase or sale of TEIA Tokens as investment assets.&nbsp; The Teia DAO team makes no guarantees or representations regarding the future value, utility, or performance of TEIA Tokens. The value of TEIA Tokens may fluctuate, and you may experience losses if you choose to acquire or trade them. The Teia DAO team disclaims any responsibility for such losses.</li>
        <li><b>DAO Membership</b> By claiming and/or holding TEIA Tokens, you become a member of the Teia DAO LLC. Teia does not require you to provide any personal information, as long as you hold less than 10% of Tokens in circulation. Every address is limited to XXXXX TEIA Tokens.</li>
        <li><b>Regulatory Compliance:</b> The distribution and use of TEIA Tokens may be subject to various laws, regulations, and restrictions in different jurisdictions. It is your sole responsibility to ensure compliance with any applicable laws and regulations before participating in the TEIA Token Claim process. The TEIA DAO team does not provide legal, regulatory, or tax advice.</li>
        <li><b>No Liability:</b> To the maximum extent permitted by applicable law, the TEIA DAO team, its contributors, affiliates, partners, and any other associated entities shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of or in connection with the TEIA Tokens, the Claim Page, or your participation in the TEIA Token Claim process.</li>
        <li><b>Risk Acknowledgement:</b> By participating in the TEIA Token Claim process, you acknowledge and assume the risks associated with blockchain technology, cryptocurrencies, and the volatility of the cryptocurrency market. You agree to hold the TEIA DAO team harmless against any claims, demands, actions, or liabilities arising from your participation.</li>
        <li><b>No Endorsement:</b> The inclusion of any third-party links or references on the Claim Page does not imply endorsement, approval, or responsibility by the TEIA DAO team. The TEIA DAO team does not control or guarantee the accuracy, relevance, timeliness, or completeness of any third-party content.</li>
        <li><b>Updates and Amendments:</b> The TEIA DAO team reserves the right to modify, update, or amend this disclaimer at any time without prior notice. Your continued use of the Claim Page following any such modifications constitutes your acceptance of the revised disclaimer.</li>
        </ol>
      </div>

      
    </Page>
  )
}
