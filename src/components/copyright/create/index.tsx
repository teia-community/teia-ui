import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCopyrightStore } from '@context/copyrightStore'
// import { useUserStore } from '@context/userStore'
import { Button } from '@atoms/button'
import { HashToURL } from '@utils'
import { HEN_CONTRACT_FA2 } from '@constants'
import styles from './index.module.scss'

export function CopyrightCreate() {
  const navigate = useNavigate()
  const { customLicenseData } = useCopyrightStore()
  // const address = useUserStore((st) => st.address)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error'
    message: string
    opHash?: string
  } | null>(null)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionStatus(null)

    try {
      const { submitCopyrightAgreement } = useCopyrightStore.getState()
      const opHash = await submitCopyrightAgreement()

      if (opHash) {
        setSubmissionStatus({
          type: 'success',
          message: `Copyright agreement submitted successfully! Operation Hash: ${opHash}`,
          opHash
        })
      } else {
        setSubmissionStatus({
          type: 'error',
          message: 'Failed to submit copyright agreement. Please try again.'
        })
      }
    } catch (error: any) {
      console.error('Copyright submission error:', error)
      setSubmissionStatus({
        type: 'error',
        message: `Error: ${error.message || 'Unknown error occurred'}`
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!customLicenseData?.tokens?.length) {
    return (
      <div className={styles.container}>
        <h2>No tokens selected</h2>
        <p>Please go back to the Edit tab and select tokens to create a copyright agreement.</p>
        <Button onClick={() => navigate('/copyright')}>
          Go to Edit Tab
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2>Create Copyright Agreement</h2>

      {submissionStatus && (
        <div className={`${styles.status} ${styles[submissionStatus.type]}`}>
          <p>{submissionStatus.message}</p>
          {submissionStatus.opHash && (
            <p>
              <small>
                View on explorer:
                <a
                  href={`https://better-call.dev/mainnet/opg/${submissionStatus.opHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {submissionStatus.opHash}
                </a>
              </small>
            </p>
          )}
        </div>
      )}

      <div className={styles.summary}>
        <h3>Summary</h3>

        <div className={styles.section}>
          <h4>Selected Works ({customLicenseData.tokens.length})</h4>
          <div className={styles.tokenGrid}>
            {customLicenseData.tokens.map((token, index) => (
              <div key={index} className={styles.tokenCard}>
                {token.contractAddress !== 'external' && token.metadata?.displayUri && (
                  <img
                    src={HashToURL(token.metadata.displayUri, 'IPFS')}
                    alt={token.metadata.name}
                    className={styles.tokenImage}
                  />
                )}
                <div className={styles.tokenInfo}>
                  <h5>{token.metadata?.name || `Token ${token.tokenId}`}</h5>
                  <div className={styles.verificationStatus}>
                    {token.contractAddress === HEN_CONTRACT_FA2 ? (
                      <span className={styles.verified}>☑️✅ TEIA + Tezos Verified</span>
                    ) : token.contractAddress.startsWith('KT1') ? (
                      <span className={styles.tezosVerified}>✅ Tezos Verified</span>
                    ) : (
                      <span className={styles.external}>⚠️ External Link</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h4>Rights Granted</h4>
          <ul className={styles.rightsList}>
            {customLicenseData.clauses.reproduce && <li>✅ Right to Reproduce</li>}
            {customLicenseData.clauses.broadcast && <li>✅ Right to Broadcast</li>}
            {customLicenseData.clauses.publicDisplay && <li>✅ Right to Public Display</li>}
            {customLicenseData.clauses.createDerivativeWorks && <li>✅ Right to Create Derivative Works</li>}
            {customLicenseData.clauses.requireAttribution && <li>✅ Attribution Required</li>}
            {customLicenseData.clauses.rightsAreTransferable && <li>✅ Rights Are Transferable</li>}
            {customLicenseData.clauses.releasePublicDomain && <li>✅ Released to Public Domain</li>}
            {customLicenseData.clauses.expirationDateExists && (
              <li>⏱️ Expires on: {customLicenseData.clauses.expirationDate}</li>
            )}
          </ul>
        </div>

        {customLicenseData.clauses.addendum && (
          <div className={styles.section}>
            <h4>Additional Notes</h4>
            <p className={styles.addendum}>{customLicenseData.clauses.addendum}</p>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          onClick={() => navigate('/copyright/copyrightpreview')}
          disabled={isSubmitting}
        >
          Back to Preview
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          shadow_box
        >
          {isSubmitting ? 'Submitting...' : 'Create & Submit Copyright Agreement'}
        </Button>
      </div>

      {submissionStatus?.type === 'success' && (
        <div className={styles.successActions}>
          <Button onClick={() => navigate('/copyright')}>
            Create Another Agreement
          </Button>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      )}
    </div>
  )
}