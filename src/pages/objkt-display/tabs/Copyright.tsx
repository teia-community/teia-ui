import { Container } from '@atoms/layout'
import { useEffect, useState } from 'react'

import { HashToURL } from '@utils'
import { Line } from '@atoms/line'
import { useObjktDisplayContext } from '..'

export const Copyright = () => {
  const { nft, viewer_address } = useObjktDisplayContext()
  const [licenseData, setLicenseData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true) // New loading state
  const [hasError, setHasError] = useState(false) // New error state

  const clauseLabels: Record<string, string> = {
    reproduce: 'Right to Reproduce',
    broadcast: 'Right to Broadcast',
    publicDisplay: 'Right to Public Display',
    createDerivativeWorks: 'Right to Create Derivative Works',
    exclusiveRights: 'Exclusive Rights',
    retainCreatorRights: 'Retain Creator Rights Even When Exclusive',
    requireAttribution: 'Require Attribution on Use',
    rightsAreTransferable: 'Rights are Transferable (Secondary Sales)',
    releasePublicDomain: 'Release to Public Domain',
    customUriEnabled: 'Custom URI Enabled',
    customUri:
      'Custom URI (External Terms & Works Connected To This Agreement)',
  }

  const descriptions: Record<string, Record<string, string>> = {
    reproduce: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    broadcast: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    publicDisplay: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    createDerivativeWorks: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    releasePublicDomain: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    customUriEnabled: {
      true: '📝 Yes',
      false: '🚫 No',
    },
    retainCreatorRights: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    requireAttribution: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    rightsAreTransferable: {
      true: '✅ Yes',
      false: '🚫 No',
    },
  }

  const exclusiveRightsDescriptions: Record<string, string> = {
    none: '🚫 None (No Exclusive Rights To Any Party)',
    majority: '⚖️ Majority Share (50%+ Editions Owned = Exclusive Rights)',
    superMajority:
      '⚖️ Super-Majority Share (66.667%+ Editions Owned = Exclusive Rights)',
  }

  const url = nft?.right_uri ? HashToURL(nft.right_uri, 'CDN', { size: 'raw' }) : ''

  function isValidUrl(string: string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  useEffect(() => {
    if (!url) {
      setIsLoading(false)
      return
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then((data) => {
        setLicenseData(data)
        setHasError(false)
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error)
        setHasError(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [url])

  if (isLoading) {
    return <div>Loading license information...</div>
  }

  if (hasError || (!licenseData && !nft?.rights)) {
    return <div>N/A or License Data Not Specified. 🚫</div>
  }

  return (
    <>
      {nft?.rights === 'custom' && (
        <>
          <Container>
            <div>
              <h3>Custom License Info</h3>
              <br />
              <h4>URI to Agreement (Permanent)</h4>
              <a href={url} target="_blank" rel="noopener noreferrer">
                Metadata
              </a>
              <br />
              <br />
              <h4>License Details</h4>
              <ul>
                {licenseData?.clauses &&
                  Object.entries(licenseData?.clauses).map(([key, value]) => {
                    const title = clauseLabels[key]
                    const displayValue = descriptions[key]
                      ? descriptions[key][value as string]
                      : value
                    if (key === 'exclusiveRights') {
                      return (
                        <li key={key}>
                          Exclusive Rights: {exclusiveRightsDescriptions[value as string]}
                        </li>
                      )
                    }
                    if (key === 'expirationDate') {
                      return (
                        <li key="expirationDate">
                          Expiration Date:{' '}
                          {value
                            ? new Date(
                              (licenseData?.clauses as any)?.expirationDate
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                            : 'None'}
                        </li>
                      )
                    }
                    if (key === 'customUri') {
                      const uriDisplay =
                        (licenseData?.clauses as any)?.customUriEnabled && value ? (
                          <a
                            href={value as string}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {value as string}
                          </a>
                        ) : (
                          'None'
                        )
                      return (
                        <li key={key}>
                          {title}: {uriDisplay}
                        </li>
                      )
                    }
                    if (key === 'addendum' || key === 'expirationDateExists') {
                      return null
                    }
                    return (
                      <li key={key}>
                        {title}: {displayValue as React.ReactNode}
                      </li>
                    )
                  })}
              </ul>
            </div>
          </Container>
          <Line />
          <br />
          <Container>
            <>
              <h2>Custom License Agreement</h2>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {licenseData?.documentText || 'No license document available.'}
              </pre>
            </>
          </Container>
        </>
      )}
      {nft?.rights && (
        <Container>
          <>
            <h3>License Information</h3>
            <p>{nft?.rights}</p>
            {nft?.right_uri && (
              <>
                <h4>Link to Metadata</h4>
                <a
                  href={
                    isValidUrl(nft?.right_uri)
                      ? nft?.right_uri
                      : HashToURL(nft?.right_uri, 'CDN', { size: 'raw' })
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Metadata Link
                </a>
              </>
            )}
          </>
        </Container>
      )}
    </>
  )
}
