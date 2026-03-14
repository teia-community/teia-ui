import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Loading } from '@atoms/loading'
import { useFA2Tokens } from '@data/token-gate'
import { CIDToURL } from '@utils/index'
import styles from './index.module.scss'

const TEST_FA2 = 'KT1LHXjgnURrnCybZ26mEQM3RQ2tLbpZwmi6'

function ipfsToUrl(uri) {
  if (!uri) return null
  const cid = uri.replace('ipfs://', '')
  return CIDToURL(cid, 'IPFS', { size: 'raw' })
}

export default function TokenRoomBrowser() {
  const { data: tokens, isLoading } = useFA2Tokens(TEST_FA2)

  return (
    <Page title="Token Chat">
      <div className={styles.container}>
        <Link
          to="/testnet"
          style={{
            fontSize: '13px',
            display: 'inline-block',
            marginBottom: 12,
          }}
        >
          &larr; Back to Testnet
        </Link>
        <h1 className={styles.headline}>Token Chat</h1>

        {isLoading && <Loading />}

        {!isLoading && (!tokens || tokens.length === 0) && (
          <p className={styles.empty}>No tokens found.</p>
        )}

        <div className={styles.tokenGrid}>
          {tokens?.map((token) => {
            const imgUrl = ipfsToUrl(
              token.metadata?.thumbnailUri ||
                token.metadata?.displayUri ||
                token.metadata?.artifactUri
            )
            return (
              <Link
                key={token.tokenId}
                to={`/testnet/token-chat/${token.contract.address}/${token.tokenId}`}
                className={styles.tokenCard}
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={token.metadata?.name || ''}
                    className={styles.tokenImage}
                  />
                ) : (
                  <div className={styles.tokenImagePlaceholder}>#</div>
                )}
                <div className={styles.tokenInfo}>
                  <div className={styles.tokenName}>
                    {token.metadata?.name || `Token #${token.tokenId}`}
                  </div>
                  <div className={styles.tokenMeta}>
                    #{token.tokenId} · {token.totalSupply} ed.
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </Page>
  )
}
