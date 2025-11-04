import { useState } from 'react' // Import useState for state management
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import styles from '@style'
import { Line } from '@atoms/line'

export const FAQ = () => {
  const Question = ({ text, answer }) => {
    const [isOpen, setIsOpen] = useState(false) // State to manage visibility

    const toggleAnswer = () => {
      setIsOpen(!isOpen) // Toggle the state
    }

    return (
      <li className={styles.buttons}>
        <Button onClick={toggleAnswer}>{text}</Button>
        {isOpen && (
          <div
            className={styles.faq__answer}
            dangerouslySetInnerHTML={{ __html: answer }} // Render HTML content
          />
        )}
      </li>
    )
  }

  return (
    <Page title="faq" large>
      <div className={styles.faq__outer__container}>
        <h1 className={styles.faq__title}>
          Getting Started with the TEIA Community
        </h1>
        <ul className={styles.faq__container}>
          <Question
            text="How do I Make a Wallet?"
            answer={`
<div class="markdown-body">
  <br />
  <p>First, you will need a Tezos wallet and Tezos funds.</p>
  <br />
  <div class="markdown-heading">
    <h2 class="heading-element">What is Tezos?</h2>
  </div>
  <p>Tezos (XTZ) is a liquid proof-of-stake cryptocurrency (LPoS). You can read more about it <a href="https://en.wikipedia.org/wiki/Tezos" rel="nofollow">on the Wikipedia Article about Tezos</a>.</p>
  <br />
  <div class="markdown-heading">
    <h2 class="heading-element">Recommended Wallet Apps</h2>
  </div>
  <ul>
    <li><a href="https://templewallet.com/" rel="nofollow">Temple wallet</a> which is a browser extension similar to Metamask, also being able to connect to Ledger devices.</li>
    <li><a href="https://wallet.kukai.app/" rel="nofollow">Kukai wallet</a>, which is a browser wallet, being possible to connect making use of Direct Auth using Twitter credentials. Kukai also works on smartphones.</li>
  </ul>
  <br />
  <div class="markdown-heading">
    <h2 class="heading-element">Where to Buy Tezos</h2>
  </div>
  <p>Minting on Teia only costs ~0.05 tezos. You can buy some tezos on an exchange site like Binance or Kraken. However, the exchange service might be limited depending on your country and location.</p>
  <br />
  <div class="markdown-heading">
    <h1 class="heading-element">The Teia Fountain</h1>
  </div>
  <br />
  <div class="markdown-heading">
    <h3 class="heading-element">⛲ Applying as an Artist</h3>
  </div>
  <p>Are you an artist who needs tez but can't get it? You can request a volunteer from the community to sponsor you in the #fountain channel on <a href="https://discord.gg/wGeXs4Z7wT" rel="nofollow">Discord</a>.</p>
  <br />
  <p>Please fill out this google form:</p>
  <ul>
    <li><a href="https://docs.google.com/forms/d/e/1FAIpQLScUYFFw2eUXX64RHOPwUD1LZ8hD4qaiGRpOg-Su1El-W2OXGQ/viewform" rel="nofollow">https://docs.google.com/forms/d/e/1FAIpQLScUYFFw2eUXX64RHOPwUD1LZ8hD4qaiGRpOg-Su1El-W2OXGQ/viewform</a></li>
    <li>After filling out the form, please send us a message in the #fountain channel on the Discord saying that you filled out the form.</li>
  </ul>
  <br />
  <div class="markdown-heading">
    <h3 class="heading-element">⛲ Volunteering as a Sponsor</h3>
  </div>
  <p>If you make some sales and would like to support other new artists you can send XTZ donations to the <a href="https://github.com/teia-community/teia-docs/wiki/Teia-Multisig-wallets">fountain multisig address</a> <strong>KT1EsvmkijLKPQmcJMbjDeKRXdwky1LWvwpG</strong></p>
  <br />
  <div class="markdown-heading">
    <h2 class="heading-element">Common Wallet Errors</h2>
  </div>
  <br />
  <p><strong>account doesn't exist error from tzkt.io</strong></p>
  <p>If your account on tzkt.io shows this, don't worry. It just means you don't have any transactions yet in your wallet. Once you receive some tezos it should go away.</p>
  <br />
  <p><strong>Prevalidation error in the temple wallet</strong></p>
  <p>This means you should refresh the page. Wait a couple of seconds for the transaction to go through and you will get the "applied" status.</p>
</div>
`}
          />
          <Question
            text="How do I Mint?"
            answer={`
<div class="markdown-body">
  <br />
  <div class="markdown-heading">
    <h3 class="heading-element"><strong>mint</strong></h3>
  </div>
  <br />
  <p>1: <em>(verb)</em> to create an OBJKT (NFT)</p>
  <br />
  <hr>
  <div class="markdown-heading">
    <h2 class="heading-element">Important Rules and Considerations</h2>
  </div>
  <p>If you mint NFTs on Teia, we expect you to respect the <a href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions">Core Values</a> and especially note the detail on <a href="https://github.com/teia-community/teia-docs/wiki/Core-Values-Code-of-Conduct-Terms-and-Conditions#about-copyminting">copyminting</a>.</p>
  <br />
  <p><em><strong>Copyminting</strong> is the act of taking another's work and minting it as your own. It also includes the act of minting the same work twice, either on the same or separate platforms/blockchains. Your account will get restricted if you do this.</em></p>
  <br />
  <p><strong>Please note that minting the same media file twice, even accidentally, may lead to an account restriction! If you made a mistake and want to re-mint your OBJKT, make sure to burn the old one first!</strong> <a href="https://github.com/teia-community/teia-docs/wiki/How-to-burn-%F0%9F%94%A5">(How to burn)</a></p>
  <br />
  <p><strong>If your account gets restricted, check <a href="https://objkt.com/asset/KT1XcFQv9EB2hoT484Cv58S2MvyMGX4C9TJq/1" rel="nofollow">how to unrestrict</a> it.</strong></p>
  <br />
  <div class="markdown-heading">
    <h2 class="heading-element">Step-by-Step Guide</h2>
  </div>
  <p>Minting is the operation of creating an NFT - at this point, you define the quantity of the NFT and information about it such as title and description. Once created, you will choose the number you want to make available and a price - this is a Swap operation.</p>
  <br />
  <p>It might be useful to prepare a text file with all the information you will need for minting - if the minting operation is interrupted, you might lose what you typed in. OGs know from experience how frustrating it can be, especially if you wrote a classy and long description without saving a copy.</p>
  <br />
  <ol>
    <li>
      <p>You should have already created a wallet (we recommend <a href="https://templewallet.com/" rel="nofollow">Temple</a> or <a href="https://wallet.kukai.app/" rel="nofollow">Kukai</a>). The wallet needs to have enough funds to mint. Click on “Sync". Your browser will show a pop-up asking you to sync with your wallet.</p>
      <br />
      <p><img src="https://camo.githubusercontent.com/06ef047ef421441b995cefa7ab335c59ab81bea9868a2bb395c150287a21b3c5/68747470733a2f2f692e6962622e636f2f323543574c6b332f73796e632e706e67" alt="sync button"></p>
      <p><img src="https://user-images.githubusercontent.com/6487972/226333131-7487d30a-a622-4e57-b037-1d442fe2597f.jpg" alt="beacon wallet popup"></p>
    </li>
    <li>
      <p>Approve the sync with your wallet.</p>
    </li>
    <br />
    <li>
      <p>Click the "Mint" link in the hamburger drop-down menu.</p>
      <br />
      <p><img src="https://user-images.githubusercontent.com/6487972/226333939-3dc61a26-73a1-4b8a-b4b4-d164f530e719.jpg" alt="minting page white"></p>
    </li>
    <br />
    <li>
      <p>Fill out the information for your OBJKT. Because all this information is stored on the Tezos blockchain, the edition size (quantity) you set is final; you can't add (although you can reduce by burning). Title, descriptions, tags, and royalties are also final. You price the OBJKT (a Swap operation) after the minting. You can upload display images/gifs depending on the media type (e.g., for mpgs).</p>
      <p>You can also select a license (default is None (all rights reserved)) and a language.</p>
    </li>
  </ol>
  <br />
  <div class="markdown-heading">
    <h3 class="heading-element"><strong>Text Mints on Teia</strong></h3>
  </div>
  <p>The Teia NFT marketplace now supports text mints of mimetype: text/plain. This allows for stories, poems, ASCII, and similar types of text-based art. The token's content is stored in IPFS.</p>
  <br />
  <div class="markdown-heading">
    <h3 class="heading-element"><strong>How to Mint Text</strong></h3>
  </div>
  <ol>
    <li>A new field on the minting page: "This is a text mint." Check this box.</li>
    <li>The text mint input will automatically hide and replace the description box.</li>
    <li>You will see the following fields on the minting form:
      <ul>
        <li>A checkbox for "Monospace Font Required."</li>
        <li>There is a text area labeled "Typed Art Input." Depending on the monospace font required checkbox value, the text area renders the monospace (Iosevka font) or non-monospace (Source Sans Pro font).</li>
      </ul>
    </li>
    <li>As you type text into the text area, a rendered preview of that text is displayed below it.</li>
    <li>The preview page is displayed once you click the "Submit" button.</li>
  </ol>
  <br />
  <p><strong>Note:</strong> The "monospace" tag is automatically added. The cover and thumbnail images are automatically generated based on the text input and the font selected. The description will also automatically be replaced by the text mint input.</p>
  <br />
  <p>You can view an example: <a href="https://teia.art/objkt/850488" rel="nofollow">OBJKT 850488</a></p>
  <br />
  <p>Source Sans Pro was selected for text mints as it's the default font (non-mono) on Objkt.com. This ensures text is encoded correctly and displayed as intended on Objkt.com and Teia.art. Currently, it seems that Objkt.com does not provide much monospace support for text mints, and a feature request has been raised here: <a href="https://roadmap.objkt.com/b/software-feature-request/use-a-monospaced-font-for-text-tokens/" rel="nofollow">https://roadmap.objkt.com/b/software-feature-request/use-a-monospaced-font-for-text-tokens/</a></p>
  </div>
`}
          />
          <Question
            text="How do I Edit My Profile?"
            answer={`
<div class="markdown-body">
  <br />
  <div class="markdown-heading">
    <h2 class="heading-element">Settings &gt; Config</h2>
  </div>
  <br />
  <p>Profile information is useful in a number of ways. Most importantly, it can identify you to your potential collectors. Your profile details are saved with the Subjkt contract. The Profile page is where you update these, and it also links to the tzprofiles site so you can add that information.</p>
  <br />
  <p>To edit your profile, make sure you've synced your wallet with Teia. Click the menu icon or go to: <a href="https://www.teia.art/subjkt" rel="nofollow">https://www.teia.art/subjkt</a></p>
  <br />
  <p><img src="https://user-images.githubusercontent.com/6487972/222891286-6610bcdc-d99c-41cf-963e-c7c0c7fea7f8.jpg" alt=""></p>
  <br />
  <p>.. then click on the <strong>Profile</strong> option</p>
  <br />
  <p><img src="https://user-images.githubusercontent.com/6487972/225549393-810d6ccb-e4b2-4aba-bdca-b38ec44a1b7d.jpg" alt="full menu showing - profile highlighted"></p>
  <br />
  <p>Add a username, description, and choose an image for your profile pic. The profile pic may take a few moments to show up. Because it shows with a circular crop, you may have to adjust your initial picture and add it again.</p>
  <br />
  <p><strong>IMPORTANT</strong> <em>When configuring your username, please don't use any special characters or spaces. It's also case-sensitive, so we recommend ALL LOWERCASE.</em></p>
  <br />
  <p><img src="https://user-images.githubusercontent.com/6487972/222891328-88b309e9-d814-4d9a-8253-1f1f3a3fc3a9.jpg" alt="profile page - fields highlighted"></p>
  <br />
  <p>When you click Save Profile, your wallet will open so you can complete a transaction which saves the profile information.</p>
  <br />
  <p><img src="https://user-images.githubusercontent.com/6487972/225555404-8c9e635b-0492-4e90-bbcb-5fcc781eac4e.jpg" alt="profile and tzprofile copy"></p>
  <br />
  </div>
`}
          />
          <Question
            text="How do I Add/Change the Price of My OBJKT?"
            answer={`
<div class="markdown-body">
  <br />
  <h1>How to Swap 🔃</h1>
  <br />
  <p>1: <em>(noun)</em> an act, instance, or process of exchanging one thing for another</p>
  <p>2: <em>(verb)</em> to set a price for your OBJKT</p>
  <br />
  <p>If you have just minted some OBJKTs or you have unsold OBJKTs, it's time to Swap them - that means pricing some or all, for collectors to buy.</p>
  <br />            
  <p><strong>Note</strong> - you can't swap OBJKTs that are already swapped, have already been collected, or if you don't have enough tez to pay the fees. You won't see Swap, Burn, Transfer options or be able to cancel swaps if you haven't synced the account that owns them.</p>
  <br />
  <p>You don't need to swap all of the OBJKTs you own. Many artists like to keep one or two, either as 'artist proofs' or for gifting etc.</p>
  <br />
  <p>Pricing is a tricky area that can be based on how big the edition size is, how well known and liked you are for your artwork, and how well you market it. Another consideration is how much <em>you</em> want for the work, not considering collectors and the current market. Pricing consistently and with some thought will influence some collectors.</p>
  <br />
  <p>If you're considering pricing very low (0.01 tez, for example) or free, consider the fact that bots or bottom-dwelling flippers may buy many (sometimes all). When collectors view the OBJKT history, they will see the churn of low price activity that such flippers create, and it can reflect badly on how responsible collectors will view both the work and you as an artist. You can give away manually or try to regulate flipper action by swapping in blocks at different times (this also helps collectors in different time zones).</p>
  <br />
  <h3>Step-by-Step Guide</h3>
  <ol>
    <li>
      <p>Click on your OBJKT's link to see the details. If you are synced to your wallet, you should see the "Swap" option next to History. (If you don’t see these options, then you have to sync your wallet again.)</p>
    </li>
    <li>
      <p>Click on Swap.</p>
    </li>
    <li>
      <p>Input how many OBJKTs out of your edition that you want to set for sale. For example, if you have <code>10</code> and you want to keep <code>1</code> and sell <code>9</code>, then input <code>9</code>. If you want to sell all of them, input <code>10</code>.</p>
    </li>
    <li>
      <p>Input how much each edition should cost in Tezos.</p>
    </li>
    <li>
      <p>Click the "swap" button. You will be prompted to approve the transaction in your wallet app.</p>
    </li>
    <li>
      <p>The user interface will update you on the transaction, or you can check in your wallet (look at 'activity' in Temple wallet). Once the transaction approves, your OBJKT/s are for sale to collectors. Go out and tell the Twitter world...</p>
    </li>
  </ol>
  <br />
  <h3>How Can I Track What I've Sold?</h3>
  <p>You can use the tools <a href="https://www.hictory.xyz/#" rel="nofollow">hictory</a> or <a href="https://hicdex.com/sold" rel="nofollow">hicdex</a>: Just enter your wallet address and see your last sales in chronological order!</p>
  <br />
  <h3>How Can I Get Notifications for When I Sell Something?</h3>
  <p>You can use the Cryptonoises bot <a href="https://cryptonoises.com/" target="_blank" rel="nofollow">[https://cryptonoises.com/]</a> developed by Andrii Bakulin. It works with both Telegram and Discord to get a notification every time something sells.</p>
</div>
`}
          />
          <Question
            text="How do I Burn My OBJKT?"
            answer={`
<div class="markdown-body">
  <br />
  <p>1: <em>(verb)</em> to "delete" your OBJKT</p>
  <br />
  <p>Transactions on the blockchain are irreversible, so you can't "delete" them. The "burn" button sends the OBJKT to the <a href="https://tzkt.io/tz1burnburnburnburnburnburnburjAYjjX/operations/" rel="nofollow">burn address</a> - tz1burnburnburnburnburnburnburjAYjjX, or you can send it yourself using your wallet app. The burn address is an open address that nobody owns a key to, so objkts are never retrievable.</p>
  <p>If you are burning the objkt because you made a mistake and want to remint it, make sure there are no other owners - you can only burn those you own, so you will need to ask those collectors to burn those objkts before you can remint.</p>
  <br />
  <h3>To Burn an OBJKT:</h3>
  <ol>
    <li>
      <p>Make sure your wallet app is synced with Teia.</p>
    </li>
    <li>
      <p>Make sure you cancel the swap of the OBJKT so it can be available in your wallet when you are ready to burn it. The user interface will show you how many you have available for burning. Think very hard about how many you'll burn - you can't undo this.</p>
      <br />
      <p><img src="https://user-images.githubusercontent.com/6487972/227187937-600b66ec-627b-428f-8e47-cd8f1926c385.jpg" alt="burn screen"></p>
    </li>
    <li>
      <p>Press the burn button. Your wallet app will prompt you to confirm the transaction. Once the transaction completes, your wallet app will show the OBJKT as transferred to the burn address. The History tab will show a Burn transaction (and the fact that it is a transfer from your wallet to the burn wallet).</p>
      <br />
      <p><img src="https://user-images.githubusercontent.com/6487972/227189047-4bda94e0-352d-41c2-b8dd-fc63d730062e.jpg" alt="burning"></p>
      <p><img src="https://user-images.githubusercontent.com/6487972/227189074-9653b3cf-3264-4814-90b3-804abb0ce107.jpg" alt="burn successful"></p>
    </li>
    <li>
      <p>You can also send the OBJKT to a burn address directly from your Tezos wallet. The address is: <code>tz1burnburnburnburnburnburnburjAYjjX</code>.</p>
    </li>
  </ol>
  <br />
  <p><strong>Note:</strong> <em>If you burn all of the objkts that were minted, the objkt will disappear from your profile. If someone buys one of your editions, even if you burn the rest of them, the OBJKT won't disappear from your profile.</em></p>
</div>
`}
          />
          <Question
            text="How do I Resell an OBJKT?"
            answer={`
<div class="markdown-body">
  <br />
  <h2>How to Sell an OBJKT Created by Another Artist</h2>
  <p>If you've collected another artist's OBJKT, then you own the right to resell it. This is also referred to as placing your OBJKT on the secondary market. It's much the same as swapping one of your own creations, although a royalty will be paid to the artist.</p>
  <br />
  <h3>Step-by-Step Guide</h3>
  <ol>
    <li>
      <p>Make sure your wallet is synced.</p>
    </li>
    <li>
      <p>Load your account page on Teia.</p>
    </li>
    <li>
      <p>Click on "collection" and click on the OBJKT you want to resell.</p>
    </li>
    <li>
      <p>Click on the "listings" tab to see all of the owners and sellers.</p>
    </li>
    <li>
      <p>Click on "swap" and set a price for your OBJKT. Remember - if there are royalties, that percentage will go to the artist, so consider that in the pricing.</p>
    </li>
    <li>
      <p>Click on the "swap" button and confirm the transaction in your wallet app.</p>
    </li>
  </ol>
  <br />
  <p>After your swap is active, the listing will show up in the <strong>Curation</strong> tab on your profile.</p>
  <p><em>IMPORTANT: Once swapping something up for sale, it is held in the Teia escrow wallet while it is "on the market." Therefore, the OBJKT will disappear from your collections. Don't worry; it's still up for sale!</em></p>
  <hr>
  <br />
  <h3>How Can I Track What I've Sold?</h3>
  <p>You can use the tools on <a href="https://hicdex.com" rel="nofollow">hicdex.com</a> to track transaction history.</p>
  <br />
  <h3>How Can I Get Notifications When I Sell Something?</h3>
  <p>You can use the Cryptonoises Telegram bot <a href="https://cryptonoises.com/" rel="nofollow">[https://cryptonoises.com/]</a> to get a notification every time something sells. We have Andrii Bakulin to thank for this very useful tool. Support him if you are able.</p>
</div>
`}
          />
          <Question
            text="How Do I Get Started With Selling Copy and Usage Rights With TEIA?"
            answer={`
<div class="markdown-body">
  <br />
  <h2>TEIA's Copyright Features©️</h2>
  <p>TEIA empowers artists to attach copy and usage rights clauses to each minted OBJKT (NFT). These clauses are determined and declared by the artist at the time of minting. If you are interested in using this feature, it is essential to carefully read and understand the descriptions, explanations, and implications of each option before proceeding.</p>
  <br />
  <p>The primary purpose of this feature is to enable artists to sell usage rights for their works in a transparent, legal, and fair manner. The blockchain facilitates this process by providing clear, objective, and easily traceable documentation of the agreement and the involved parties.</p>
  <br />
  <p>Collectors may acquire these rights for purposes such as broadcasting, reproduction, merchandise sales, soundtracks, game assets, etc. TEIA DAO acts as a neutral platform that facilitates these agreements but does not intervene in or enforce the terms of the agreements. Please note that support for these clauses may vary across platforms, as the data is minted on-chain but not all platforms may choose to display or honor it.</p>
  <br />
  <p><strong>Disclaimer:</strong> TEIA is not a legal entity, organization, or institution with the authority to enforce laws or resolve disputes. The agreements attached to each mint (NFT) constitute a direct contractual relationship between the artist (licensor) and the collector (licensee). The terms of these agreements are determined at the time of minting and must be resolved through mutually agreed-upon means in the event of a dispute. Both parties are responsible for conclusively proving ownership of the relevant wallet(s) if required.</p>
  <br />
  <h3>Step-by-Step Guide</h3>
  <p>A member of the TEIA organization has minted the latest guide as an NFT here:</p>
  <br />
  <p><a href="/objkt/869379" target="_blank">©️ TEIA Copyright Registration and Licensing Guide</a></p>
  <br />
  <h3>Important Notes</h3>
  <ul>
    <li><strong>Artist Responsibility:</strong> As the artist, you are responsible for clearly defining the terms of the agreement and ensuring they align with your intentions for the work.</li>
    <li><strong>Collector Responsibility:</strong> Collectors must review and agree to the terms before purchasing the OBJKT. Failure to comply with the terms may result in legal consequences.</li>
    <li><strong>Dispute Resolution:</strong> In the event of a dispute, both parties are encouraged to resolve the matter amicably. If necessary, seek legal counsel to enforce or interpret the terms of the agreement.</li>
  </ul>
  <br />
  <p>By using TEIA's copyright features, you acknowledge and agree to these terms. TEIA provides the tools to facilitate these agreements but assumes no liability for their enforcement or interpretation.</p>
</div>
`}
          />
        </ul>
      </div>
      <br />
      <Line />
      <div className={styles.faq__outer__container}>
        <h1>GitHub Documents (Open Source)</h1>
        <ul className={styles.faq__container}>
          <Question
            text="General FAQ"
            answer={`
<p>For general questions, check out the <a href="https://github.com/teia-community/teia-docs/wiki/General-FAQs" target="_blank" rel="noopener noreferrer">General FAQ</a> page.</p>
`}
          />
          <Question
            text="Troubleshooting"
            answer={`
<p>If you're having issues, visit the <a href="https://github.com/teia-community/teia-docs/wiki/Troubleshooting" target="_blank" rel="noopener noreferrer">Troubleshooting Guide</a>.</p>
`}
          />
          <Question
            text="Useful Tools"
            answer={`
<p>Explore tools created by the community:</p>
<ul>
  <li><a href="https://github.com/teia-community/teia-docs/wiki/Tools-made-by-the-community" target="_blank" rel="noopener noreferrer">Tezos Toolkit</a></li>
  <li><a href="https://tezos.com/ecosystem" target="_blank" rel="noopener noreferrer">NFT Marketplaces</a></li>
</ul>
`}
          />
          <Question
            text="User Safety"
            answer={`
<p>Stay safe by following these tips:</p>
<ul>
  <li><strong>Never share your private key</strong>.</li>
  <li>Use trusted wallets and platforms.</li>
  <li>Enable two-factor authentication (2FA) where available.</li>
</ul>
`}
          />
        </ul>
      </div>
    </Page>
  )
}
