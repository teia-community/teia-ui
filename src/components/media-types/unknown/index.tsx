import { useEffect, useState } from 'react'

export const UnknownComponent = ({ mimeType }: { mimeType?: string }) => {
  const [processingState, setProcessingState] = useState('checking')

  useEffect(() => {
    // If we have a mimeType that's known (like PNG), but we're still hitting this component,
    // it likely means we're in a metadata processing state
    const isKnownMimeType = mimeType?.toLowerCase().includes('png')

    if (isKnownMimeType) {
      setProcessingState('processing')
    } else {
      setProcessingState('unknown')
    }
  }, [mimeType])

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-gray-100 rounded p-4 text-center">
        {processingState === 'processing' ? (
          <div>
            <p>Metadata processing...</p>
            <p className="text-sm text-gray-500">
              Please wait while we process your file
            </p>
          </div>
        ) : (
          <div>
            <p>Unknown file type: {mimeType}</p>
            <p className="text-sm text-gray-500">
              This file type is not supported
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnknownComponent
