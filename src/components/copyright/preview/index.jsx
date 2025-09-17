import { useNavigate } from 'react-router'
import { useCopyrightStore } from '@context/copyrightStore'
import { Button } from '@atoms/button'
import { HashToURL } from '@utils'
import { HEN_CONTRACT_FA2 } from '@constants'
import { ClausesDescriptions } from '../form/CustomCopyrightForm'
import styles from './index.module.scss'

export function CopyrightPreview() {
  const navigate = useNavigate()
  const { customLicenseData } = useCopyrightStore()

  if (!customLicenseData?.tokens?.length) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>No Copyright Data Available</h2>
          <p>Please go back to the Edit tab to create your copyright agreement.</p>
          <Button onClick={() => navigate('/copyright')}>
            Go to Edit Tab
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2>Preview Copyright Agreement</h2>
      
      <div className={styles.previewContent}>
        {/* Selected Works Section */}
        <div className={styles.section}>
          <h3>Selected Works to Apply Copyright Agreement ({customLicenseData.tokens.length})</h3>
          <div className={styles.tokenGrid}>
            {customLicenseData.tokens.map((token, index) => (
              <div key={index} className={styles.tokenCard}>
                {token.contractAddress !== 'external' && token.metadata?.displayUri ? (
                  <img
                    src={HashToURL(token.metadata.displayUri, 'IPFS')}
                    alt={token.metadata.name}
                    className={styles.tokenImage}
                  />
                ) : token.contractAddress !== 'external' && token.metadata?.thumbnailUri ? (
                  <img
                    src={HashToURL(token.metadata.thumbnailUri, 'IPFS')}
                    alt={token.metadata.name}
                    className={styles.tokenImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    {token.contractAddress === 'external' ? '🌐' : '🖼️'}
                  </div>
                )}
                <div className={styles.tokenInfo}>
                  <h4>{token.metadata?.name || `Token ${token.tokenId}`}</h4>
                  <div className={styles.verificationStatus}>
                    {token.contractAddress === HEN_CONTRACT_FA2 ? (
                      <span className={styles.verified}>☑️✅ TEIA + Tezos Verified</span>
                    ) : token.contractAddress.startsWith('KT1') ? (
                      <span className={styles.tezosVerified}>✅ Tezos Verified</span>
                    ) : (
                      <span className={styles.external}>⚠️ External Link</span>
                    )}
                  </div>
                  {token.contractAddress !== 'external' && (
                    <div className={styles.tokenDetails}>
                      <small>Token ID: {token.tokenId}</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rights and Clauses Section */}
        <div className={styles.section}>
          <h3>Copyright Terms & Permissions</h3>
          <div className={styles.clausesContainer}>
            <ClausesDescriptions clauses={customLicenseData.clauses} />
          </div>
        </div>

        {/* Full Agreement Section */}
        <div className={styles.section}>
          <h3>Complete License Agreement</h3>
          <div className={styles.agreementContainer}>
            <div className={styles.agreementHeader}>
              <p>This is the complete legal text that will be registered on the blockchain:</p>
            </div>
            <pre className={styles.agreementText}>
              {customLicenseData?.documentText || 'No document text available.'}
            </pre>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className={styles.actions}>
        <Button onClick={() => navigate('/copyright')}>
          ← Back to Edit
        </Button>
        
        <Button 
          onClick={() => navigate('/copyright/copyrightcreate')}
          shadow_box
        >
          Proceed to Create →
        </Button>
      </div>
    </div>
  )
}
