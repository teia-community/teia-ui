import { Container } from '@atoms/layout'
import { useEffect, useState } from 'react'
import { Tags } from '@components/tags'
import styles from '@style'
import '../style.css'
import { HashToURL } from '@utils'
import { HEN_CONTRACT_FA2, LANGUAGES, LICENSE_TYPES } from '@constants'
import { getWordDate } from '@utils/time'
import { Line } from '@atoms/line'
import { useObjktDisplayContext } from '..'
import axios from 'axios'

export const Copyright = () => {
  const { nft, viewer_address } = useObjktDisplayContext()

  const [licenseData, setLicenseData] = useState(null)

  const clauseLabels = {
    reproduce: 'Right to Reproduce',
    broadcast: 'Right to Broadcast',
    publicDisplay: 'Right to Public Display',
    createDerivativeWorks: 'Right to Create Derivative Works',
    exclusiveRights: 'Exclusive Rights',
    retainCreatorRights: 'Retain Creator Rights Even When Exclusive',
    releasePublicDomain: 'Release to Public Domain',
    customUriEnabled: 'Custom URI Enabled',
    customUri: 'Custom URI',
  }

  const descriptions = {
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
      false: '⚠️ No',
    },
  }

  const exclusiveRightsDescriptions = {
    none: '🚫 None (No Exclusive Rights To Any Party)',
    majority: '⚖️ Majority Share (50%+ Editions Owned = Exclusive Rights)',
    superMajority:
      '⚖️ Super-Majority Share (66.667%+ Editions Owned = Exclusive Rights)',
  }

  const url = HashToURL(nft?.right_uri, 'CDN', { size: 'raw' })

  useEffect(() => {
    axios
      .get(url)
      .then((response) => {
        setLicenseData(response.data)
      })
      .catch((error) => console.error('Failed to fetch data:', error))
  }, [nft])

  if (!licenseData) {
    return <div>Loading...</div>
  }

  const isCustomUriOnly = () => {
    return licenseData.clauses.customUriEnabled && licenseData.clauses.customUri
  }

  return (
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
            {licenseData.clauses &&
              Object.entries(licenseData.clauses).map(([key, value]) => {
                if (isCustomUriOnly() && key !== 'customUri') {
                  return null // Do not render other clauses if customUriEnabled is true
                }
                const title = clauseLabels[key]
                const displayValue = descriptions[key]
                  ? descriptions[key][value]
                  : value
                if (key === 'exclusiveRights') {
                  return (
                    <li key={key}>
                      Exclusive Rights: {exclusiveRightsDescriptions[value]}
                    </li>
                  )
                }
                if (key === 'customUri') {
                  const uriDisplay =
                    licenseData.clauses.customUriEnabled && value ? (
                      <a href={value} target="_blank" rel="noopener noreferrer">
                        {value}
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
                return (
                  <li key={key}>
                    {title}: {displayValue}
                  </li>
                )
              })}
          </ul>
        </div>
      </Container>
      <Line />
      <br />
      <Container>
        <h2>Custom License Agreement</h2>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {licenseData?.documentText}
        </pre>
      </Container>
    </>
  )
}
