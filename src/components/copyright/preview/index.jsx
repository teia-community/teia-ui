import { useNavigate } from 'react-router'
import { useCopyrightStore } from '@context/copyrightStore'
import { Button } from '@atoms/button'
import { HashToURL } from '@utils'

export function CopyrightPreview() {
  const navigate = useNavigate()
  const { customLicenseData } = useCopyrightStore()

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Preview Copyright Information</h2>
      <br />
      {/* Display Tokens */}
      {customLicenseData?.tokens?.length > 0 && (
        <div>
          <h3>Selected Works to Apply Copyright:</h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {customLicenseData.tokens.map((token, index) => (
              <div
                key={index}
                style={{ padding: '10px', border: '1px solid #ddd' }}
              >
                <img
                  src={HashToURL(token.metadata.thumbnailUri, 'IPFS')}
                  alt={token.metadata.name}
                />
                <p>{token.metadata?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          textAlign: 'left',
          marginTop: '20px',
          padding: '10px',
          border: '1px solid #ddd',
        }}
      >
        <h3>Selected Clauses:</h3>
        <ul>
          <li>
            Right to Reproduce:{' '}
            {customLicenseData?.clauses.reproduce ? '✅ Yes' : '🚫 No'}
          </li>
          <li>
            Right to Broadcast:{' '}
            {customLicenseData?.clauses.broadcast ? '✅ Yes' : '🚫 No'}
          </li>
          <li>
            Right to Public Display:{' '}
            {customLicenseData?.clauses.publicDisplay ? '✅ Yes' : '🚫 No'}
          </li>
          <li>
            Right to Create Derivative Works:{' '}
            {customLicenseData?.clauses.createDerivativeWorks
              ? '✅ Yes'
              : '🚫 No'}
          </li>
          <li>
            Exclusive Rights: {customLicenseData?.clauses.exclusiveRights}
          </li>
          <li>
            Creator Retains Rights:{' '}
            {customLicenseData?.clauses.retainCreatorRights
              ? '✅ Yes'
              : '⚠️ No'}
          </li>
          <li>
            Rights Are Transferable:{' '}
            {customLicenseData?.clauses.rightsAreTransferable
              ? '✅ Yes'
              : '🚫 No'}
          </li>
          <li>
            Clauses Have Expiration Date:{' '}
            {customLicenseData?.clauses.expirationDateExists
              ? '✅ Yes'
              : '🚫 No'}
          </li>
          {customLicenseData?.clauses.expirationDateExists && (
            <li>
              Expiration Date:{' '}
              {customLicenseData.clauses.expirationDate || 'None'}
            </li>
          )}
          <li>
            Release to Public Domain:{' '}
            {customLicenseData?.clauses.releasePublicDomain
              ? '✅ Yes'
              : '🚫 No'}
          </li>
          <li>
            Custom URI Enabled:{' '}
            {customLicenseData?.clauses.customUriEnabled ? '✅ Yes' : '🚫 No'}
          </li>
          {customLicenseData?.clauses.customUriEnabled && (
            <li>Custom URI: {customLicenseData.clauses.customUri}</li>
          )}
          {customLicenseData?.clauses.addendum && (
            <li>Addendum: {customLicenseData.clauses.addendum}</li>
          )}
        </ul>
      </div>

      {/* Display Agreement */}
      <div
        style={{ border: '1px solid #ccc', padding: '15px', marginTop: '15px' }}
      >
        <h3>Generated Copyright Agreement:</h3>

        <pre
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            textAlign: 'left',
          }}
        >
          {customLicenseData?.documentText || 'No document text available.'}
        </pre>
      </div>

      {/* Buttons */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <Button
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            marginTop: '15px',
          }}
          onClick={() => navigate('/copyright')}
        >
          Go Back
        </Button>
        <Button
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            marginTop: '15px',
          }}
          onClick={async () => {
            const { submitCopyrightAgreement } = useCopyrightStore.getState()
            const opHash = await submitCopyrightAgreement()
            if (opHash) {
              console.log('Operation successful:', opHash)
            }
          }}
        >
          Confirm & Submit
        </Button>
      </div>
    </div>
  )
}
