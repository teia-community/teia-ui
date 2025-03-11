import { useNavigate } from 'react-router'
import { useCopyrightStore } from '@context/copyrightStore'
import { Button } from '@atoms/button'

export const CopyrightPreview = () => {
  const navigate = useNavigate()
  const { customLicenseData } = useCopyrightStore((state) => state)

  return (
    <div style={{ padding: '20px' }}>
      <h2>Preview Your Copyright Information</h2>

      {customLicenseData ? (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            border: '1px solid #ccc',
            padding: '15px',
            marginTop: '15px',
          }}
        >
          <h3>Generated Copyright Agreement:</h3>
          <pre>{customLicenseData.documentText}</pre>
        </div>
      ) : (
        <p>No copyright information provided.</p>
      )}

      <div style={{ marginTop: '20px' }}>
        <Button onClick={() => navigate('/copyright')}>Go Back</Button>
        <Button onClick={() => console.log('Call Copyright Contract')} fit shadow_box>
          Create Copyright Now
        </Button>
      </div>
    </div>
  )
}
