/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useEffect, useCallback } from 'react'
import { Checkbox, Input, Textarea } from '@atoms/input'
import ReactSelect from 'react-select'
import styles from '@style'
import { style as select_style, theme } from '../../atoms/select/styles'
import { useOutletContext } from 'react-router'
import { useMintStore } from '@context/mintStore'
import { copyrightModalText } from './copyrightmodaltext'
import { InfoModal } from '@atoms/modal'

const initialClauses = {
  reproduce: false,
  broadcast: false,
  publicDisplay: false,
  createDerivativeWorks: false,
  exclusiveRights: 'none', // Options are 'none', 'majority', 'superMajority'
  retainCreatorRights: true, // When exclusive rights conditions are met, does the Creator retain their rights to their own work?
  releasePublicDomain: false,
  customUriEnabled: false,
  customUri: '',
  addendum: '',
}

const clauseLabels = {
  reproduce: 'Right to Reproduce',
  broadcast: 'Right to Broadcast',
  publicDisplay: 'Right to Public Display',
  createDerivativeWorks: 'Right to Create Derivative Works',
  exclusiveRights: 'Exclusive Rights Based on Ownership Share',
  retainCreatorRights: 'Creator Retains Rights Even When Exclusive',
  releasePublicDomain: 'Release to Public Domain',
  customUriEnabled: 'Custom URI',
  overview: 'Copyright Overview',
}

export const exclusiveRightsOptions = [
  { value: 'none', label: ' 🚫 None (No Exclusive Rights To Any Party)' },
  {
    value: 'majority',
    label: ' ⚖️ Majority Share (50%+ Editions Owned = Exclusive Rights)',
  },
  {
    value: 'superMajority',
    label:
      ' ⚖️ Super-Majority Share (66.667%+ Editions Owned = Exclusive Rights)',
  },
]

export const ClausesDescriptions = ({ clauses }) => {
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

  return (
    <div>
      <strong>Copyright Permissions Granted on Ownership:</strong>
      <ul>
        {clauses.customUriEnabled ? (
          <>
            <li>Custom URI Enabled: {descriptions.customUriEnabled[true]}</li>
            <li>Custom URI: {clauses?.customUri || 'No URI Set'}</li>
          </>
        ) : (
          Object.entries(clauses).map(([key, value]) => {
            if (key === 'exclusiveRights') {
              const exclusiveLabel =
                exclusiveRightsOptions.find((option) => option.value === value)
                  ?.label || 'None'
              return <li key={key}>Exclusive Rights: {exclusiveLabel}</li>
            } else if (key === 'customUri') {
              return null
            } else if (key === 'addendum') {
              return <li key={key}>Addendum: {value ? '✅ Yes' : '🚫 No'}</li>
            } else {
              const displayValue =
                descriptions[key]?.[value] || 'Unknown Status'
              return (
                <li key={key}>
                  {clauseLabels[key]}: {displayValue}
                </li>
              )
            }
          })
        )}
      </ul>
      <br />
    </div>
  )
}

function CustomCopyrightForm({ onChange, value }) {
  const { license, minterName, address } = useOutletContext()
  const [clauses, setClauses] = useState(initialClauses)
  const [generatedDocument, setGeneratedDocument] = useState(
    'No Permissions Chosen'
  )
  const [documentText, setDocumentText] = useState('No Permissions Chosen') // necessary for State management in parent element
  const [uriError, setUriError] = useState('')

  const updateCustomLicenseData = useMintStore(
    (state) => state.updateCustomLicenseData
  )

  let clauseNumber = 1

  const generateDocumentText = useCallback(() => {
    let minterInfo = minterName ? `[${minterName}, ${address}]` : `[${address}]`
    let documentText = `This Custom License Agreement ("Agreement") is granted by the creator ("Creator") of the Non-Fungible Token ("NFT") identified by the owner of wallet address ${minterInfo} ("Wallet Address"). This Agreement outlines the rights and obligations associated with the ownership and use of the NFT's likeness and any derivatives thereof ("Work").
\n“Editions” refers to the total number of authorized copies of the NFT that the Creator issues at the time of minting. Each copy represents an "Edition" of the NFT, allowing multiple Owners (or one Owner holding multiple copies) to hold rights to the Work under the terms of this Agreement.`

    documentText += `\n\nIn cases where multiple Creators or Collaborators have contributed to the creation of the Work, the rights and obligations stipulated herein apply equally to all Creators. Each Creator is entitled to the rights granted under this Agreement, and such rights are shared collectively among all Creators unless specified otherwise.`

    if (clauses.releasePublicDomain) {
      documentText += `\n\n${clauseNumber++}. Release to Public Domain:
The Creator hereby releases all copyright and related rights, title, and interest in and to the Work into the public domain, free from any copyright restrictions. This release applies globally, allowing for the free use, reproduction, and modification of the Work without any compensation due to the Creator.`
    } else {
      if (clauses.reproduce) {
        documentText += `\n\n${clauseNumber++}. Right to Reproduce:
The Creator hereby grants to each owner of the NFT ("Owner") a worldwide license to use the Work for both commercial and non-commercial reproduction purposes.`
      }
      if (clauses.broadcast) {
        documentText += `\n\n${clauseNumber++}. Right to Broadcast:
The Creator grants to each Owner a worldwide license to use the Work for broadcasting purposes for both commercial and non-commercial use.`
      }
      if (clauses.publicDisplay) {
        documentText += `\n\n${clauseNumber++}. Right to Public Display:
The Creator grants to each Owner a worldwide license to publicly display the Work, either as a physical display or as a performance for live events. This license does not permit the monetization of the Work by the Owner and requires the Owner to provide full attribution to the Creator.`
      }
      if (clauses.createDerivativeWorks) {
        documentText += `\n\n${clauseNumber++}. Right to Create Derivative Works:
The Creator grants to each Owner a worldwide license to publicly display the Work, either as a physical display or as a performance for live events. This license does not permit the monetization of the Work by the Owner and requires the Owner to provide full attribution to the Creator.`
      }
    }

    // contract defaults to "All Rights Reserved" where nothing is chosen
    if (
      !clauses.publicDisplay &&
      !clauses.reproduce &&
      !clauses.broadcast &&
      !clauses.createDerivativeWorks &&
      !clauses.releasePublicDomain
    ) {
      documentText += `\n\n${clauseNumber++}. All Rights Reserved: 
No rights are granted under this Agreement. All rights for the Work are reserved solely by the Creator.`
    }

    if (clauses.exclusiveRights === 'none') {
      documentText += `\n\n${clauseNumber++}. Exclusive Rights:
No exclusive rights are granted under this Agreement. All rights are non-exclusive and shared among all rightful owners or licensees - or in cases of "All Rights Reserved", exclusivity is granted solely to the Creator themselves.`
    } else if (
      clauses.reproduce ||
      clauses.broadcast ||
      clauses.publicDisplay ||
      clauses.createDerivativeWorks
    ) {
      // at least one rights clause must be picked for exclusive rights to be an option
      const rightsDescription =
        clauses.exclusiveRights === 'majority'
          ? 'majority share (over 50%)'
          : 'super-majority share (66.667%+ or exactly 2/3rds)'
      documentText += `\n\n${clauseNumber++}. Exclusive Rights:
The Creator grants exclusive rights as outlined in this Agreement to the Owner(s) holding a ${rightsDescription} of the editions of the NFT at the time of its original mint. If no single party holds such a share, the rights outlined in this Agreement apply non-exclusively to all Owners. (In some cases, the Creator themselves may be the exclusive Owner.)`
    }

    if (clauses.exclusiveRights !== 'none' && clauses.retainCreatorRights) {
      documentText += `\n\n${clauseNumber++}. Retention of Creator's Rights:
Despite reaching the threshold for exclusive rights, the Creator retains certain rights as specified under this Agreement, even if exclusivity conditions are met by other Owners. The rights are then split equally between the Creator and Owner which has been granted exclusive rights over the other Owner(s) of the Work, effective immediately after the date in which the condition for exclusivity has been met.`
    }

    documentText += `\n\n${clauseNumber++}. Jurisdiction and Legal Authority:
This Agreement is subject to and shall be interpreted in accordance with the laws of the jurisdiction in which the Creator and Owner(s) are domiciled. The rights granted hereunder are subject to any applicable international, national, and local copyright and distribution laws.`

    documentText += `\n\n${clauseNumber++}. Identification and Representation:
Each Owner (including the Creator and all Collaborators) affirms that the wallet address provided is under their control or under the control of the party they legitimately represent. Each Owner accepts all responsibility for validating their ownership or representative authority of the said wallet address. It is the Owner's duty to provide satisfactory proof of ownership or authorization as may be required to establish their connection to the wallet address in question. Failure to conclusively demonstrate such ownership or authority may result in denial of access to services, rights, or privileges associated with the wallet address under this Agreement.`

    documentText += `\n\n${clauseNumber++}. Amendments and Modifications:
This Agreement may be amended or modified only by a written document signed by both the Creator and the Owner(s) holding the relevant majority or super-majority share, as applicable.`

    documentText += `\n\n${clauseNumber++}. Proof of Ownership and Responsibility:
Each individual claiming ownership ("Claimant") must conclusively prove that they are the legitimate Owner or Creator of the specified wallet address associated with this Agreement. It is the sole responsibility of the Claimant to provide irrefutable evidence supporting their claim. This proof may include, but is not limited to, cryptographic signatures, transaction histories, and other blockchain-based verifications that establish an undeniable link between the Claimant and the wallet address in question. Failure to provide satisfactory evidence will result in the denial of any rights, privileges, or access purportedly associated with the wallet address under the terms of this Agreement.`

    documentText += `\n\n${clauseNumber++}. Limitation of Platform Responsibility:
This Agreement is entered into solely between the Creator and the Owner(s) of the Non-Fungible Token ("NFT") and the associated digital or physical artwork ("Work"). TEIA (teia.art), formally operating under TEIA DAO LLC, and its affiliated members, collectively referred to as "Platform," do not bear any responsibility for the enforcement, execution, or maintenance of this Agreement. The Platform serves only as a venue for the creation, display, and trading of NFTs and does not participate in any legal relationships established under this Agreement between the Creator and the Owner(s). All responsibilities related to the enforcement and adherence to the terms of this Agreement rest solely with the Creator and the Owner(s). The Platform disclaims all liability for any actions or omissions of any user related to the provisions of this Agreement.`

    documentText += `\n\n${clauseNumber++}. Perpetuity of Agreement:
This Agreement remains effective in perpetuity as long as the Owner(s) can conclusively demonstrate proof of ownership of the NFT representing the Work, beyond reasonable doubt. Proof of ownership must be substantiated through reliable and verifiable means, which may include, but are not limited to, transaction records, cryptographic proofs, or any other blockchain-based evidence that unequivocally establishes ownership. This perpetual license ensures that the rights and privileges granted under this Agreement persist as long as the ownership criteria are met and validated.`

    documentText += `\n\n${clauseNumber++}. Transfer of Rights Upon Change of Ownership:
The rights and obligations stipulated in this Agreement, along with any associated privileges, shall transfer automatically to a new owner upon the change of ownership from one wallet to another. This transfer is triggered by the sale, gift, or any form of transfer of the NFT that embodies the Work. The transfer of rights becomes effective immediately following the timestamp of the transaction recorded on the blockchain. It is incumbent upon the new Owner to verify and uphold the terms set forth in this Agreement, ensuring continuity and adherence to the stipulated conditions. The previous Owner's rights under this Agreement cease concurrently with the transfer of ownership.`

    // Additional notes based on user input
    if (clauses.addendum) {
      documentText += `\n\nAddendum By Creator:\n${clauses?.addendum}`
    }

    return documentText
  }, [address, clauseNumber, clauses, minterName])

  // logic for checkboxes
  const handleChange = useCallback((value, name) => {
    const newValue = Object.prototype.hasOwnProperty.call(value, 'value')
      ? value.value
      : value

    if (name === 'customUriEnabled') {
      if (newValue) {
        setClauses((prev) => ({
          ...prev,
          reproduce: false,
          broadcast: false,
          publicDisplay: false,
          createDerivativeWorks: false,
          exclusiveRights: 'none',
          retainCreatorRights: true,
          releasePublicDomain: false,
          customUriEnabled: true,
        }))
      } else {
        setClauses((prev) => ({
          ...prev,
          customUriEnabled: false,
          customUri: prev.customUri,
        }))
      }
    }
    // Handle 'Release to Public Domain' logic
    else if (name === 'releasePublicDomain' && newValue === true) {
      setClauses({
        reproduce: false,
        broadcast: false,
        publicDisplay: false,
        createDerivativeWorks: false,
        exclusiveRights: 'none',
        retainCreatorRights: true,
        releasePublicDomain: true,
        customUriEnabled: false,
        customUri: '',
      })
    } else {
      // Normal handling for other checkboxes
      setClauses((prev) => ({
        ...prev,
        [name]: newValue,
        ...(name !== 'releasePublicDomain' && prev.releasePublicDomain
          ? { releasePublicDomain: false }
          : null),
      }))
    }
  }, [])

  const handleUriChange = (eventOrValue) => {
    const value = eventOrValue.target ? eventOrValue.target.value : eventOrValue

    function isValidURI(uri) {
      try {
        new URL(uri)
        return true
      } catch (error) {
        return false
      }
    }
    if (isValidURI(value)) {
      setClauses((prev) => ({
        ...prev,
        customUri: value,
      }))
    } else {
      // Handle error state, perhaps set an error message in state
      console.error('Invalid URI')
    }
  }

  // Addendum handling
  const handleInputChange = (eventOrValue) => {
    let name, value

    if (eventOrValue.target) {
      name = eventOrValue.target.name
      value = eventOrValue.target.value
    } else {
      name = 'addendum'
      value = eventOrValue
    }

    setClauses((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Logic for metadata and document updates
  useEffect(() => {
    let documentText
    const hasActiveRights =
      clauses.reproduce ||
      clauses.broadcast ||
      clauses.publicDisplay ||
      clauses.createDerivativeWorks ||
      clauses.releasePublicDomain

    if (clauses.customUriEnabled) {
      documentText = `Custom URI: ${clauses.customUri}`
    } else if (!hasActiveRights) {
      documentText = 'No Permissions Chosen'
    } else {
      documentText = generateDocumentText()
    }

    setDocumentText(documentText)
    setGeneratedDocument(documentText)
    updateCustomLicenseData({ clauses: clauses, documentText: documentText })
  }, [
    clauses?.reproduce,
    clauses?.broadcast,
    clauses?.publicDisplay,
    clauses?.createDerivativeWorks,
    clauses?.exclusiveRights,
    clauses?.releasePublicDomain,
    handleChange,
    generateDocumentText,
    updateCustomLicenseData,
  ])

  // sync to parent State management
  useEffect(() => {
    onChange({ clauses, documentText })
  }, [clauses, documentText, onChange])

  const propertiesWithCheckboxes = [
    'reproduce',
    'broadcast',
    'publicDisplay',
    'createDerivativeWorks',
    'releasePublicDomain',
  ]

  // Info Modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    content: '',
  })

  const handleModalOpen = (clauseName) => {
    const modalContent = copyrightModalText[clauseName]

    setModalState({
      isOpen: true,
      title: clauseLabels[clauseName],
      content: modalContent || 'No detailed information available.',
    })
  }

  const handleKeyPress = (event, title) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleModalOpen(title)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--gray-20)' }}>
      <h3>
        Custom License Generation Form
        <span
          style={{ marginLeft: '0.5em' }}
          role="button"
          tabIndex={0}
          onClick={() => handleModalOpen('overview')}
          onKeyPress={(event) =>
            handleKeyPress(event, clauseLabels['overview'])
          }
        >
          (?)
        </span>
      </h3>
      <div style={{ marginTop: '1em' }}>
        {propertiesWithCheckboxes.map((clauseName) => (
          <div style={{ display: 'flex' }} key={clauseName}>
            <Checkbox
              key={clauseName}
              name={clauseName}
              label={clauseLabels[clauseName]}
              checked={clauses[clauseName]}
              onCheck={(checked) => handleChange(checked, clauseName)}
              disabled={
                clauses.customUriEnabled ||
                (clauses.releasePublicDomain &&
                  clauseName !== 'releasePublicDomain')
              }
            />
            <span
              role="button"
              tabIndex={0}
              className={styles.modalInfoIcon}
              onClick={() => handleModalOpen(clauseName)}
              onKeyPress={(event) =>
                handleKeyPress(event, clauseLabels[clauseName])
              }
            >
              (?)
            </span>
          </div>
        ))}
        {modalState.isOpen && (
          <InfoModal
            isOpen={modalState.isOpen}
            title={modalState.title}
            content={
              <div dangerouslySetInnerHTML={{ __html: modalState.content }} />
            }
            onClose={() =>
              setModalState((prev) => ({ ...prev, isOpen: false }))
            }
          />
        )}
        <div className="select-container" style={{ marginTop: '2em' }}>
          <div style={{ display: 'flex' }}>
            <h4>{clauseLabels.exclusiveRights}</h4>
            <span
              role="button"
              tabIndex={0}
              className={styles.modalInfoIcon}
              onClick={() => handleModalOpen('exclusiveRights')}
              onKeyPress={(event) =>
                handleKeyPress(event, clauseLabels['exclusiveRights'])
              }
            >
              (?)
            </span>
          </div>
          <ReactSelect
            name="exclusiveRights"
            options={exclusiveRightsOptions}
            value={exclusiveRightsOptions.find(
              (option) => option.value === clauses.exclusiveRights
            )}
            onChange={(selectedOption) =>
              handleChange(selectedOption, 'exclusiveRights')
            }
            placeholder="Select Ownership Share Type"
            isDisabled={
              clauses.customUriEnabled ||
              !Object.values(clauses).some((value) => value && value !== 'none')
            }
            styles={select_style}
            theme={theme}
            className={styles.container}
            classNamePrefix="react_select"
          />
          {['majority', 'superMajority'].includes(clauses.exclusiveRights) && ( // Creator rights retention generated only when exclusive is chosen
            <Checkbox
              name="retainCreatorRights"
              label="Creator Retains Their Rights Even When Exclusivity is Reached"
              checked={clauses.retainCreatorRights}
              onCheck={(checked) =>
                handleChange(checked, 'retainCreatorRights')
              }
              className={styles.field}
            />
          )}
        </div>
        {(clauses.reproduce ||
          clauses.broadcast ||
          clauses.publicDisplay ||
          clauses.createDerivativeWorks ||
          clauses.releasePublicDomain) && (
          <div style={{ marginTop: '1em' }}>
            <h4>Addendum/Notes</h4>
            <Textarea
              type="text"
              name="addendum"
              value={clauses?.addendum || ''}
              onChange={handleInputChange}
              placeholder="Add additional notes, clauses, restrictions, scopes, etc."
              className={styles.field}
            />
          </div>
        )}
        <div style={{ marginTop: '1em' }}>
          <div style={{ display: 'flex' }}>
            <Checkbox
              name="customUriEnabled"
              label="Use Custom URI"
              checked={clauses?.customUriEnabled}
              onCheck={(checked) => handleChange(checked, 'customUriEnabled')}
              className={styles.field}
            />
            <span
              role="button"
              tabIndex={0}
              className={styles.modalInfoIcon}
              onClick={() => handleModalOpen(clauseLabels['customUriEnabled'])}
              onKeyPress={(event) =>
                handleKeyPress(event, clauseLabels['customUriEnabled'])
              }
            >
              (?)
            </span>
          </div>
          {clauses?.customUriEnabled && (
            <Input
              type="text"
              value={clauses?.customUri || ''}
              onChange={(e) => handleUriChange(e)}
              placeholder="Paste URI/URL Here (ipfs://, http://, https://)"
              className={styles.field}
            />
          )}
          {uriError && <div className={styles.errorText}>{uriError}</div>}
        </div>
      </div>
      <div
        style={{
          maxWidth: '100%',
          overflow: 'auto',
          padding: '15px',
          margin: '20px 0',
          border: '1px solid #ccc',
          whiteSpace: 'pre-wrap',
        }}
      >
        <h2>Custom License Agreement</h2>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
          }}
        >
          {generatedDocument}
        </pre>
      </div>
    </div>
  )
}

export default CustomCopyrightForm
