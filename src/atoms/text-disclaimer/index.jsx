import styles from './index.module.scss'

export function TextDisclaimer() {
  return (
    <div className={styles.disclaimer}>
      <p>
        Welcome to TEIA's on-chain text post platform — where every post is
        published directly to the Tezos blockchain via TEIA's minting contract.
      </p>
      <p>
        Each post is treated as an NFT, much like the artworks on TEIA. Text
        content is stored with the MIME type "Markdown," and posts can be
        bought, sold, or collected just like any other token on the platform.
      </p>
      <p>
        Users have the option to "burn" their posts, removing them from
        circulation on teia.art. However, the underlying record remains
        permanently etched on the blockchain. Before posting, please keep in
        mind that while burning removes the post from teia.art, it does not
        erase it entirely. Due to the permissionless and decentralized nature of
        the system, posts may also appear on other platforms or websites without
        notice or consent.
      </p>
      <p>
        Please review TEIA's <a href="/terms">Terms of Service</a> and{' '}
        <a href="/codeofconduct">Code of Conduct</a> before posting. These
        guidelines apply to content hosted on this site, though they may not
        extend to external platforms.
      </p>
    </div>
  )
}
