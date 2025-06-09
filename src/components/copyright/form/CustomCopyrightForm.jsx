/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useEffect, useCallback } from 'react'
import { Checkbox, Input, Textarea } from '@atoms/input'
import ReactSelect from 'react-select'
import styles from '@style'
import { style as select_style, theme } from '../../../atoms/select/styles'
import { useOutletContext } from 'react-router'
import { copyrightModalText } from './copyrightmodaltext'
import { InfoModal } from '@atoms/modal'
import { useFormContext } from 'react-hook-form'
import { HEN_CONTRACT_FA2 } from '@constants'
import { useCopyrightStore } from '@context/copyrightStore'
import { HashToURL } from '@utils'
import { fetchTokenMetadata } from '@data/swr'

const initialClauses = {
  reproduce: false,
  broadcast: false,
  publicDisplay: false,
  createDerivativeWorks: false,
  exclusiveRights: 'none',
  retainCreatorRights: true,
  releasePublicDomain: false,
  requireAttribution: true,
  rightsAreTransferable: true,
  expirationDate: '',
  expirationDateExists: false,
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
  requireAttribution: 'Require Attribution on Use',
  rightsAreTransferable: 'Rights are Transferable',
  expirationDateExists: 'Clauses Have Expiration Date',
  expirationDate: 'Date of Expiration',
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
    requireAttribution: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    rightsAreTransferable: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    expirationDateExists: {
      true: '✅ Yes',
      false: '🚫 No',
    },
    expirationDate: {
      null: 'None',
      default: new Date(clauses?.expirationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
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
        {Object.entries(clauses).map(([key, value]) => {
          if (key === 'exclusiveRights') {
            const exclusiveLabel =
              exclusiveRightsOptions.find((option) => option?.value === value)
                ?.label || 'None'
            return <li key={key}>Exclusive Rights: {exclusiveLabel}</li>
          } else if (key === 'customUri' || key === 'expirationDate') {
            return null
          } else if (key === 'expirationDateExists') {
            return (
              <React.Fragment key={key}>
                <li key={key}>
                  {clauseLabels[key]}: {descriptions[key][value]}
                </li>
                <li key="expirationDate">
                  {clauseLabels.expirationDate}:{' '}
                  {clauses.expirationDateExists && clauses.expirationDate
                    ? new Date(clauses.expirationDate).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )
                    : 'None'}
                </li>
              </React.Fragment>
            )
          } else if (key === 'addendum') {
            return <li key={key}>Addendum: {value ? '✅ Yes' : '🚫 No'}</li>
          } else if (key === 'customUriEnabled') {
            return value ? (
              <li key={key}>
                Custom URI Enabled: {descriptions?.customUriEnabled[true]}
              </li>
            ) : null
          } else {
            const displayValue = descriptions[key]?.[value] || 'Unknown Status'
            return (
              <li key={key}>
                {clauseLabels[key]}: {displayValue}
              </li>
            )
          }
        })}
      </ul>
      <br />
    </div>
  )
}

function CustomCopyrightForm({ onChange, value, defaultValue }) {
  const { watch } = useFormContext()
  const { license, minterName, address } = useOutletContext()
  const [clauses, setClauses] = useState(
    defaultValue?.clauses || initialClauses
  )
  const [generatedDocument, setGeneratedDocument] = useState(
    'No Permissions Chosen'
  )
  const [documentText, setDocumentText] = useState('No Permissions Chosen')

  const [searchTokenQuery, setSearchTokenQuery] = useState('')
  const { customLicenseData } = useCopyrightStore()
  const [tokens, setTokens] = useState(customLicenseData?.tokens || [])
  const [currentToken, setCurrentToken] = useState(null)
  const [currentExternalToken, setCurrentExternalToken] = useState(null)
  const [fetchingToken, setFetchingToken] = useState(false)

  const handleSearchTokenSubmit = async (e) => {
    e.preventDefault()
    setFetchingToken(true)
    setCurrentToken(null)

    if (!searchTokenQuery || searchTokenQuery.trim() === '') {
      openModal('Invalid Input', 'The input cannot be empty.')
      setFetchingToken(false)
      return
    }

    const token = extractTokenFromString(searchTokenQuery)

    if (!token) {
      const externalToken = {
        contractAddress: 'external',
        tokenId: null,
        metadata: {
          name: searchTokenQuery,
          thumbnailUri: '',
          creators: [address],
          description:
            "*This is an external or custom token reference - make sure that the link is valid and will be maintained for the agreement's applicable usage and time frames.",
        },
      }

      setCurrentExternalToken(externalToken)
      setFetchingToken(false)
      return
    }

    const isDuplicate = tokens.some(
      (addedToken) =>
        addedToken.contractAddress === token.contractAddress &&
        addedToken.tokenId === token.tokenId
    )

    if (isDuplicate) {
      openModal('Duplicate Token', 'This token has already been added.')
      setFetchingToken(false)
      return
    }

    try {
      const tokenData = await fetchTokenMetadata(
        token.contractAddress,
        token.tokenId
      )
      const tokenCreators = tokenData?.metadata?.creators || []

      if (!tokenCreators.includes(address)) {
        openModal('Ownership Verification', 'This is not your token.')
        setFetchingToken(false)
        return
      }

      setCurrentToken({ ...token, metadata: tokenData.metadata })
    } catch (err) {
      console.error(err)
      openModal('Error', 'Could not fetch token data.')
    }

    setFetchingToken(false)
  }
  const extractTokenFromString = (url) => {
    try {
      const match = url.match(/(KT1\w+)?\/(\d+)/)
      if (match) {
        return {
          contractAddress: match[1] || HEN_CONTRACT_FA2,
          tokenId: match[2],
        }
      }
    } catch (error) {
      console.error('Error extracting token:', error)
    }
    return null
  }

  const handleSearchTokenInputChange = (event) => {
    //console.log('event', event)
    setSearchTokenQuery(event)
  }

  const handleRemoveToken = (indexToRemove, event) => {
    event.preventDefault()
    event.stopPropagation()
    const updatedTokens = tokens.filter((_, index) => index !== indexToRemove)
    const newDocumentText = generateDocumentText(updatedTokens)
    setTokens(updatedTokens)
    setDocumentText(newDocumentText)
    setGeneratedDocument(newDocumentText)
    //console.log('remove', newDocumentText)
    useCopyrightStore.setState((prevState) => ({
      customLicenseData: {
        ...prevState.customLicenseData,
        tokens: updatedTokens,
        clauses,
        documentText: newDocumentText,
      },
    }))
  }

  const openModal = (title, content) => {
    setModalState({ isOpen: true, title, content })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, title: '', content: '' })
  }

  let clauseNumber = 1

  const generateDocumentText = useCallback(
    (customTokens = tokens) => {
      let minterInfo = minterName
        ? `[${minterName}, ${address}]`
        : `[${address}]`
      {
        /**
    const tokenTitles = tokens
      .map((token) => `"${token.metadata.name}"`)
      .join(', ') */
      }
      const tokenTitles = customTokens
        .map((token, index) => {
          const id = `#${index + 1}`
          if (token.contractAddress === 'external') {
            return `${id}: "${token.metadata.name}" (External Reference)`
          } else {
            return `${id}: "${token.metadata.name}" (Token ID: ${token.tokenId}, Contract: ${token.contractAddress})`
          }
        })
        .join('\n')

      const nonTeiaTokens = tokens.filter(
        (token) => token.contractAddress !== HEN_CONTRACT_FA2
      )

      let mintingContractsInfo = ''
      if (nonTeiaTokens.length > 0) {
        const uniqueContracts = [
          ...new Set(nonTeiaTokens.map((t) => t.contractAddress)),
        ]
        mintingContractsInfo = `Under various minting contracts, including but not limited to TEIA DAO LLC [${HEN_CONTRACT_FA2}] and contracts: ${uniqueContracts.join(
          ', '
        )}`
      } else {
        mintingContractsInfo = `Under the Minting Contract managed by the TEIA DAO LLC [${HEN_CONTRACT_FA2}]`
      }

      let documentText = `This License Agreement ("Agreement") is granted by the creator ("Creator") identified by the wallet address ${minterInfo} ("Wallet Address") for the following Work(s): 
    
${tokenTitles}
    
${mintingContractsInfo}. 

This Agreement outlines the rights and obligations associated with the ownership and use of the NFT(s)' likeness(es) and any derivatives thereof ("Work").
    
“Editions” refers to the total number of authorized copies of the NFT(s) that the Creator issues at the time of minting. Each copy represents an "Edition" of the NFT, allowing multiple Owners (or one Owner holding multiple copies) to hold rights to the Work under the terms of this Agreement.`
      {
        /**
    let documentText = `This Custom License Agreement ("Agreement") is granted by the creator ("Creator") of the Non-Fungible Token ("NFT") identified by the owner of wallet address ${minterInfo} ("Wallet Address") for the Work "${watch(
      'title'
    )}" under the Minting Contract managed by the TEIA DAO LLC [${HEN_CONTRACT_FA2}]. This Agreement outlines the rights and obligations associated with the ownership and use of the NFT's likeness and any derivatives thereof ("Work").
\n“Editions” refers to the total number of authorized copies of the NFT that the Creator issues at the time of minting. Each copy represents an "Edition" of the NFT, allowing multiple Owners (or one Owner holding multiple copies) to hold rights to the Work under the terms of this Agreement.`
 */
      }
      documentText += `\n\nIn all cases, the written text in this document will take precedence over any data or metadata displays on or off-chain as the authoritative permissions for the Work, applied to both the Creator(s) and Owner(s). Statements in the Addendums have the ability to overrule or nullify statements in the auto-generated portions of this document in cases of conflicts or inconsistencies.`
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

        if (clauses.requireAttribution) {
          documentText += `\n\n${clauseNumber++}. Requirement for Attribution:
The Owner(s) of the Work are required to give proper and visible attribution to the Creator(s) whenever the Work is used in public settings, broadcasts, or any other form of public display or performance.acknowledge the Creator(s) by name or wallet address, unless otherwise agreed upon in writing by all parties involved. Failure to provide such attribution constitutes a breach of this Agreement, subject to the remedies available under applicable law.`
        }
        if (
          clauses.rightsAreTransferable &&
          (clauses.reproduce ||
            clauses.broadcast ||
            clauses.publicDisplay ||
            clauses.createDerivativeWorks)
        ) {
          documentText += `\n\n${clauseNumber++}. Transferable Rights:
The rights granted under this Agreement to the Owner(s) of the Work are transferable. The Owner(s) may assign, transfer, or sublicense the rights to the Work, subject to maintaining proper and visible attribution to the Creator(s) whenever the Work is used in public settings, broadcasts, or any other form of public display or performance. This clause is applicable to all sales and edition numbers (unless stated otherwise), including both primary and secondary sales, promoting continuous and flexible utilization of the Work across different owners. In case of a dispute, ledger records from sales transactions will serve to confirm or deny claims as necessary. Failure to comply with attribution requirements constitutes a breach of this Agreement, subject to the remedies available under applicable law.`
        } else if (
          !clauses.rightsAreTransferable &&
          (clauses.reproduce ||
            clauses.broadcast ||
            clauses.publicDisplay ||
            clauses.createDerivativeWorks)
        ) {
          documentText += `\n\n${clauseNumber++}. Non-Transferable Rights:
The rights granted under this Agreement to the Owner(s) of the Work are non-transferable. Any attempt to transfer, assign, or sublicense the rights without explicit written consent from the Creator(s) is void. The Owner(s) must maintain proper and visible attribution to the Creator(s) whenever the Work is used in public settings, broadcasts, or any other form of public display or performance. This clause is applicable to Primary Sales, as defined as a direct sale from the Creator(s) to the first Owner(s) of an Edition of the Work from any Marketplace Contract. Upon any Secondary Sale, the rights and privileges initially granted are nullified. In case of a dispute, ledger records from sales transactions will serve to confirm or deny claims as necessary.`
        }
      }
      if (
        !clauses.publicDisplay &&
        !clauses.reproduce &&
        !clauses.broadcast &&
        !clauses.createDerivativeWorks &&
        !clauses.releasePublicDomain &&
        !clauses.requireAttribution
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

      if (clauses.expirationDate && clauses.expirationDateExists) {
        const readableDate = new Date(
          clauses.expirationDate
        ).toLocaleDateString()
        documentText += `\n\n${clauseNumber++}. Expiration Date:\nThis Agreement is effective until the date of ${readableDate} (relative to the time of mint of the Work), after which the rights granted herein will terminate unless expressly renewed or extended in writing by the Creator. Upon expiration, all rights (including exclusive rights) returns back to the Creator's ownership and control.`
      }

      if (clauses.customUriEnabled && clauses.customUri) {
        documentText += `\n\n${clauseNumber++}. Custom URI Reference and Retroactive Application:
The Work is subject to additional terms, conditions, and declarations specified at: ${
          clauses.customUri
        }. These external terms are hereby incorporated by reference into this Agreement and shall be considered binding to the same extent as if they were fully set forth herein.
    
This URI may serve one or both of the following purposes:
a) External Reference: The URI may contain supplementary terms, conditions, restrictions, or declarations that apply to this Work. These additional terms shall be considered as an extension of this Agreement.
    
b) Retroactive Application: If the URI points to a previous work by the same Creator, and the Creator can conclusively demonstrate through cryptographic proof that they control both the wallet address associated with this Work and the wallet address associated with the referenced work ${minterInfo}, then all terms, rights, and restrictions specified in this Agreement shall apply retroactively to the referenced work. Such proof must be verifiable through blockchain records or other cryptographic means that establish an undeniable connection between the Creator's wallet addresses and both works.
    
The Creator bears the burden of proving ownership of both works through wallet address verification, transaction histories, or other blockchain-based evidence. In the absence of such proof, the retroactive application shall be considered void while the external reference shall remain in effect. Any conflicts between the terms specified in the URI and this Agreement shall be resolved in favor of the more restrictive terms, unless explicitly stated otherwise in either document.`
      }

      documentText += `\n\n${clauseNumber++}. Jurisdiction and Legal Authority:
This Agreement is subject to and shall be interpreted in accordance with the laws of the jurisdiction in which the Creator and Owner(s) are domiciled. The rights granted hereunder are subject to any applicable international, national, and local copyright and distribution laws.`

      documentText += `\n\n${clauseNumber++}. Identification and Representation:
Each Owner (including the Creator and all Collaborators) affirms that the wallet address provided is under their control or under the control of the party they legitimately represent. Each Owner accepts all responsibility for validating their ownership or representative authority of the said wallet address. It is the Owner's duty to provide satisfactory proof of ownership or authorization as may be required to establish their connection to the wallet address in question. Failure to conclusively demonstrate such ownership or authority may result in denial of access to services, rights, or privileges associated with the wallet address under this Agreement.`

      documentText += `\n\n${clauseNumber++}. Amendments and Modifications:
This Agreement may be amended or modified only by a written document signed by both the Creator and the Owner(s) holding the relevant majority or super-majority share, as applicable.`

      documentText += `\n\n${clauseNumber++}. Proof of Ownership and Responsibility:
Each individual claiming ownership ("Claimant") must conclusively prove that they are the legitimate Owner or Creator of the specified wallet address associated with this Agreement. It is the sole responsibility of the Claimant to provide irrefutable evidence supporting their claim. This proof may include, but is not limited to, cryptographic signatures, transaction histories, and other blockchain-based verifications that establish an undeniable link between the Claimant and the wallet address in question. For any references (both "verified" and external) linked through the registered work, the Registrar bears full responsibility for: (a) maintaining valid proof of ownership or proper authorization for such references; (b) ensuring the continued accessibility and accuracy of such references; and (c) providing verification of such ownership upon request. Failure to provide satisfactory evidence for either wallet ownership or external reference authorization will result in the denial of any rights, privileges, or access purportedly associated with the work under the terms of this Agreement.`

      documentText += `\n\n${clauseNumber++}. Limitation of Platform Responsibility:
This Agreement is entered into solely between the Creator and the Owner(s) of the Non-Fungible Token ("NFT") and the associated digital or physical artwork ("Work"). TEIA (teia.art), formally operating under TEIA DAO LLC, and its affiliated members, collectively referred to as "Platform," do not bear any responsibility for the enforcement, execution, or maintenance of this Agreement. The Platform serves only as a venue for the creation, display, and trading of NFTs and does not participate in any legal relationships established under this Agreement between the Creator and the Owner(s). All responsibilities related to the enforcement and adherence to the terms of this Agreement rest solely with the Creator and the Owner(s). The Platform disclaims all liability for any actions or omissions of any user related to the provisions of this Agreement.`

      documentText += `\n\n${clauseNumber++}. Perpetuity of Agreement:
Unless stated otherwise (in this Agreement itself), this Agreement remains effective in perpetuity as long as the Owner(s) can conclusively demonstrate proof of ownership of the NFT representing the Work, beyond reasonable doubt. Proof of ownership must be substantiated through reliable and verifiable means, which may include, but are not limited to, transaction records, cryptographic proofs, or any other blockchain-based evidence that unequivocally establishes ownership. This perpetual license ensures that the rights and privileges granted under this Agreement persist as long as the ownership criteria are met and validated.`

      documentText += `\n\n${clauseNumber++}. Agreement Modifications:
Any modification to this Agreement's terms requires explicit consent from both the Creator(s) and current Owner(s). Such amendments shall only apply to consenting parties and shall not alter existing agreements with non-consenting Owners. The Agreement shall maintain its original terms for any Owner-Creator relationship where mutual consent to amendments is not obtained, resulting in potentially differing agreement versions existing concurrently between different Owners of the same work. Smart contract execution shall serve as conclusive evidence of acceptance of amended terms.`

      if (clauses.addendum) {
        documentText += `\n\nAddendum By Creator:\n${minterName}\n\n`
        documentText += `${clauses?.addendum}`
      }

      return documentText
    },
    [address, clauseNumber, clauses, minterName]
  )

  const handleChange = useCallback((value, name) => {
    let newValue

    if (value === null || value === undefined) {
      newValue = ''
    } else if (typeof value === 'object' && 'value' in value) {
      newValue = value.value
    } else {
      newValue = value
    }

    if (name === 'customUriEnabled') {
      setClauses((prev) => ({
        ...prev,
        customUriEnabled: newValue === true,
        ...(newValue === false && { customUri: '' }),
      }))
    } else if (name === 'releasePublicDomain' && newValue === true) {
      setClauses({
        reproduce: false,
        broadcast: false,
        publicDisplay: false,
        createDerivativeWorks: false,
        exclusiveRights: 'none',
        retainCreatorRights: false,
        rightsAreTransferable: false,
        expirationDateExists: false,
        expirationDate: '',
        releasePublicDomain: true,
        customUriEnabled: false,
        customUri: '',
      })
    } else {
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
      console.error('Invalid URI')
    }
  }

  const handleInputChange = (eventOrValue) => {
    let name, value
    if (eventOrValue?.target) {
      name = eventOrValue?.target?.name || ''
      value = eventOrValue?.target?.value || ''
    } else {
      name = 'addendum' | ''
      value = eventOrValue | ''
    }

    setClauses((prev) => ({
      ...prev,
      [name]: value || '',
    }))
  }

  useEffect(() => {
    let documentText
    const hasActiveRights =
      clauses.reproduce ||
      clauses.broadcast ||
      clauses.publicDisplay ||
      clauses.createDerivativeWorks ||
      clauses.releasePublicDomain ||
      clauses.requireAttribution

    if (!hasActiveRights && !clauses.customUriEnabled) {
      documentText =
        'No Permissions Chosen (For Addendum or Expiration Date sections to show, choose at least one option in the checkboxes above.)'
    } else {
      documentText = generateDocumentText(tokens)
    }
    const newDocumentText = generateDocumentText(tokens)
    setDocumentText(documentText)
    setGeneratedDocument(documentText)
    useCopyrightStore.setState((prevState) => ({
      customLicenseData: {
        ...prevState.customLicenseData,
        clauses,
        documentText: newDocumentText,
      },
    }))
  }, [
    clauses?.reproduce,
    clauses?.broadcast,
    clauses?.publicDisplay,
    clauses?.createDerivativeWorks,
    clauses?.exclusiveRights,
    clauses?.releasePublicDomain,
    clauses?.requireAttribution,
    clauses?.rightsAreTransferable,
    clauses?.expirationDate,
    clauses?.expirationDateExists,
    handleChange,
    generateDocumentText,
    tokens,
  ])

  useEffect(() => {
    onChange({ clauses, documentText, tokens })
    useCopyrightStore.setState({
      customLicenseData: { clauses, documentText, tokens },
    })
  }, [clauses, documentText, tokens, onChange])

  const propertiesWithCheckboxes = [
    'reproduce',
    'broadcast',
    'publicDisplay',
    'createDerivativeWorks',
    'requireAttribution',
    'rightsAreTransferable',
    'releasePublicDomain',
  ]

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    content: '',
  })

  const handleModalOpen = (clauseKey) => {
    openModal(clauseLabels[clauseKey], copyrightModalText[clauseKey])
  }

  const handleModalOpen2 = (clauseName) => {
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

  const handleDateChange = (checked) => {
    setClauses((prev) => ({
      ...prev,
      expirationDateExists: checked,
    }))
  }

  function isValidUrl(string) {
    if (!string) return false

    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--gray-20)' }}>
      <br />
      <h3>TEIA Copyright Licensing and Registration System</h3>
      <br />
      <p>
        The TEIA copyright registration system enables creators to establish
        binding terms (a declaration by the Creator) governing permitted and
        prohibited uses of their works upon sale or transfer of ownership. These
        terms are permanently recorded on the Tezos blockchain, creating an
        immutable, neutral, and transparent record.
      </p>
      <br />
      <p>
        - Ownership of a work is determined by possession of the wallet
        containing the corresponding token. In disputes, wallet owners bear the
        burden of proving ownership in the relevant jurisdiction or before the
        chosen mediator.
      </p>
      <br />
      <p>
        - The registration contract is maintained by TEIA DAO LLC, a Marshall
        Islands non-profit entity. While the DAO administers the registration
        process, enforcement remains subject to applicable local laws and
        jurisdictions.
      </p>
      <br />
      <p>
        - To gain the "☑️✅ Verified" status, the registrar must match the
        wallet addresses of the listed Work(s) with the original creator. For
        external references, the registrar assumes responsibility for
        maintaining and verifying ownership upon request.
      </p>
      <br />
      <p>
        "☑️TEIA Verified" indicates that both contracts for the works and
        registration were done on TEIA. (Most secure.)
      </p>
      <br />
      <p>
        "✅Tezos Verified" indicates that the work was created on a
        Tezos-compatible minting contract, but registered with TEIA's
        registration contract.
      </p>
      <br />
      <p>
        - People may also register works from other blockchains or digital works
        of any format provided that they can conclusively prove that they are
        the Creator(s) of said works. ("External references.")
      </p>
      <div style={{ marginTop: '1em', borderTop: '1px solid white' }}>
        <br />
        <h3>📝 Clauses</h3>
        <br />
        {propertiesWithCheckboxes.map((clauseName) => (
          <div style={{ display: 'flex' }} key={clauseName}>
            <Checkbox
              key={clauseName}
              name={clauseName}
              label={clauseLabels[clauseName]}
              checked={clauses[clauseName]}
              onCheck={(checked) => handleChange(checked, clauseName)}
              disabled={
                clauses.releasePublicDomain &&
                clauseName !== 'releasePublicDomain'
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
              !Object.values(clauses).some((value) => value && value !== 'none')
            }
            styles={select_style}
            theme={theme}
            className={styles.container}
            classNamePrefix="react_select"
          />
          {['majority', 'superMajority'].includes(clauses.exclusiveRights) && (
            <>
              <br />
              <Checkbox
                name="retainCreatorRights"
                label="Creator Retains Their Rights Even When Exclusivity is Reached"
                checked={clauses.retainCreatorRights}
                onCheck={(checked) =>
                  handleChange(checked, 'retainCreatorRights')
                }
                className={styles.field}
              />
            </>
          )}
        </div>
        <div style={{ display: 'flex' }}>
          <Checkbox
            name="expirationDateExists"
            label="Add an Expiration Date to Clauses"
            checked={clauses?.expirationDateExists}
            defaultValue={defaultValue?.clauses?.expirationDateExists}
            onCheck={handleDateChange}
            className={styles.field}
          />
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
        {clauses.expirationDateExists && (
          <div style={{ marginTop: '1em' }}>
            <h4>{clauseLabels.expirationDate}</h4>
            <Input
              type="date"
              value={clauses?.expirationDate}
              onChange={(e) => handleChange(e, 'expirationDate')}
              defaultValue={defaultValue?.clauses?.expirationDate}
              className={styles.field}
            />
          </div>
        )}
        {clauses && (
          <div style={{ marginTop: '1em' }}>
            <h4>Addendum/Notes</h4>
            <Textarea
              type="text"
              name="addendum"
              value={clauses?.addendum || ''}
              onChange={handleInputChange}
              placeholder="Add additional notes, clauses, restrictions, scopes, etc."
              defaultValue={defaultValue?.clauses?.addendum}
              className={styles.field}
            />
          </div>
        )}
        {/* <div style={{ marginTop: '1em' }}>
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
              onClick={() => handleModalOpen('customUri')}
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
        </div> */}
        <br />
        <div style={{ marginTop: '1em', borderTop: '1px solid white' }}>
          <br />
          <h3>🔎 Token Search</h3>
          <br />
          <p>
            ✅ Input the URL of an NFT minted on Tezos (XTZ) that you created to
            receive a verified status on registration. (The currently sync'd
            wallet must match the creator/author of the work for it to
            verified.)
          </p>
          <br />
          <h4>Enter Token URL</h4>
          <Input
            type="text"
            value={searchTokenQuery}
            onChange={handleSearchTokenInputChange}
            placeholder="Enter a Tezos Token URL or External URL"
            className={styles.field}
          />
          <button
            onClick={handleSearchTokenSubmit}
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              marginTop: '15px',
            }}
          >
            Search Token
          </button>
          {!isValidUrl(searchTokenQuery) && searchTokenQuery && (
            <p style={{ color: 'yellow', marginTop: '5px' }}>
              ⚠️ Warning: The above input does not follow a standard URL/URI
              scheme. (Non-standard inputs are still allowed, this is just a
              reminder.)
            </p>
          )}
        </div>

        {fetchingToken && <div className="loading-spinner"></div>}

        {currentToken && (
          <div
            className="token-preview"
            style={{ marginTop: '1em', borderTop: '1px solid white' }}
          >
            <br />
            <h3>Token Found:</h3>
            <div
              className="token-list"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                marginTop: '15px',
              }}
            >
              <img
                src={HashToURL(currentToken.metadata.displayUri, 'IPFS')}
                alt={currentToken.metadata.name}
              />
              <div>
                <h4>Title: {currentToken.metadata.name}</h4>
                <h4>Creator(s): {currentToken.metadata.creators}</h4>
                <h4>Mint Date: (?) {currentToken.metadata.mintDate}</h4>
                <br />
                <p>{currentToken.metadata.description}</p>
              </div>
            </div>
            <button
              onClick={() => {
                const updatedTokens = [...tokens, currentToken]
                const newDocumentText = generateDocumentText(updatedTokens)
                setTokens(updatedTokens)
                setCurrentToken(null)
                setSearchTokenQuery('')
                useCopyrightStore.setState((prevState) => ({
                  customLicenseData: {
                    ...prevState.customLicenseData,
                    clauses,
                    documentText: newDocumentText,
                    tokens: updatedTokens,
                  },
                }))
                setDocumentText(newDocumentText)
                setGeneratedDocument(newDocumentText)
                useCopyrightStore.setState((prevState) => ({
                  customLicenseData: {
                    ...prevState.customLicenseData,
                    clauses,
                    documentText,
                  },
                }))
              }}
              style={{
                border: '1px solid #ccc',
                padding: '15px',
                marginTop: '15px',
              }}
            >
              ➕ Add Token to Copyright Agreement
            </button>
          </div>
        )}
        {currentExternalToken && (
          <div className="token-preview">
            <br />
            <h3>External Reference Found:</h3>
            <div
              className="token-list"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                marginTop: '15px',
              }}
            >
              <div style={{ border: '1px solid #ddd', padding: '15px' }}>
                <h4>Title/Link:</h4>
                <p>{currentExternalToken.metadata.name}</p>
                <br />
                <p style={{ color: 'yellow' }}>
                  {currentExternalToken.metadata.description}
                </p>
                <br />
                <p>
                  <strong>Type:</strong> External / Manual Entry
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const updatedTokens = [...tokens, currentExternalToken]
                const newDocumentText = generateDocumentText(updatedTokens)
                setTokens(updatedTokens)
                setCurrentExternalToken(null)
                setSearchTokenQuery('')
                setDocumentText(newDocumentText)
                setGeneratedDocument(newDocumentText)
                useCopyrightStore.setState((prevState) => ({
                  customLicenseData: {
                    ...prevState.customLicenseData,
                    clauses,
                    documentText: newDocumentText,
                    tokens: updatedTokens,
                  },
                }))
              }}
              style={{
                border: '1px solid #ccc',
                padding: '15px',
                marginTop: '15px',
              }}
            >
              ➕ Add External Reference to Copyright Agreement
            </button>
          </div>
        )}
        {tokens.length > 0 && (
          <div
            className="token-list"
            style={{ marginTop: '1em', borderTop: '1px solid white' }}
          >
            <br />
            <h3>Selected Works To Apply Copyright Agreement:</h3>
            <div
              className="token-list"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                marginTop: '15px',
              }}
            >
              {tokens.map((token, index) => (
                <div
                  key={index}
                  className="token-preview"
                  style={{
                    width: '220px',
                    border: '1px solid #ddd',
                    padding: '10px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                  }}
                >
                  {token.contractAddress !== 'external' && (
                    <img
                      src={HashToURL(token.metadata.displayUri, 'IPFS')}
                      alt={token.metadata.name}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <h4
                      style={{
                        fontSize: '14px',
                        margin: '6px 0',
                        fontWeight: '600',
                      }}
                    >
                      {token.metadata.name}
                    </h4>
                    <div className={styles.verifiedStatus}>
                      {token.contractAddress === HEN_CONTRACT_FA2 ? (
                        <>☑️✅ TEIA + Tezos Verified</>
                      ) : token.contractAddress.startsWith('KT1') ? (
                        <>✅ Tezos Verified</>
                      ) : (
                        <>⚠️ External Link</>
                      )}
                    </div>
                    <br />
                    <button
                      onClick={(e) => handleRemoveToken(index, e)}
                      style={{
                        border: '1px solid #ccc',
                        padding: '15px',
                        marginTop: '15px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          maxWidth: '100%',
          overflow: 'auto',
          padding: '15px',
          marginTop: '1em',
          border: '1px solid white',
          whiteSpace: 'pre-wrap',
        }}
      >
        <h2>License Agreement</h2>
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
      {modalState.isOpen && (
        <InfoModal
          isOpen={modalState.isOpen}
          title={modalState.title}
          content={modalState.content}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

export default CustomCopyrightForm
