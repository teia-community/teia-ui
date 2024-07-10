import React, { useState, useEffect } from 'react'
import { Checkbox } from '@atoms/input'
import ReactSelect from 'react-select'
import styles from '@style'
import { style as select_style, theme } from '../../atoms/select/styles'
import { useOutletContext } from 'react-router'

const initialClauses = {
  reproduce: false,
  broadcast: false,
  publicDisplay: false,
  createDerivativeWorks: false,
  exclusiveRights: 'none', // Options are 'none', 'majority', 'superMajority'
  releasePublicDomain: false,
}

const clauseLabels = {
  reproduce: 'Right to Reproduce',
  broadcast: 'Right to Broadcast',
  publicDisplay: 'Right to Public Display',
  createDerivativeWorks: 'Right to Create Derivative Works',
  exclusiveRights: 'Exclusive Rights Based on Ownership Share',
  releasePublicDomain: 'Release to Public Domain',
}

const exclusiveRightsOptions = [
  { value: 'none', label: ' None (No Exclusive Rights To Any Party)' },
  { value: 'majority', label: ' Majority Share (50%+ Editions Owned)' },
  {
    value: 'superMajority',
    label: ' Super-Majority Share (66.667%+ Editions Owned)',
  },
]

function CustomCopyrightForm() {
  const { license, minterName, address } = useOutletContext()
  const [clauses, setClauses] = useState(initialClauses)
  const [generatedDocument, setGeneratedDocument] = useState('')

  let clauseNumber = 1

  useEffect(() => {
    // if none of the rights are selected, exclusive rights is set to "none"
    const hasActiveRights =
      clauses.reproduce ||
      clauses.broadcast ||
      clauses.publicDisplay ||
      clauses.createDerivativeWorks
    if (!hasActiveRights || clauses.releasePublicDomain) {
      setClauses((prev) => ({ ...prev, exclusiveRights: 'none' }))
    }

    let minterInfo = minterName ? `[${minterName}, ${address}]` : `[${address}]`
    let documentText = `This Custom License Agreement ("Agreement") is granted by the creator ("Creator") of the Non-Fungible Token ("NFT") identified by the owner of wallet address ${minterInfo} ("Wallet Address"). This Agreement outlines the rights and obligations associated with the ownership and use of the NFT's likeness and any derivatives thereof ("Work").
\n“Editions” refers to the total number of authorized copies of the NFT that the Creator issues at the time of minting. Each copy represents an "Edition" of the NFT, allowing multiple Owners (or one Owner holding multiple copies) to hold rights to the Work under the terms of this Agreement.`

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

    documentText += `\n\n${clauseNumber++}. Jurisdiction and Legal Authority:
This Agreement is subject to and shall be interpreted in accordance with the laws of the jurisdiction in which the Creator and Owner(s) are domiciled. The rights granted hereunder are subject to any applicable international, national, and local copyright and distribution laws.`

    documentText += `\n\n${clauseNumber++}. Identification and Representation:
Each Owner (including the Creator) affirms that the wallet address provided is under their control or under the control of the party they legitimately represent. Each Owner accepts all responsibility for validating their ownership or representative authority of the said wallet address. It is the Owner's duty to provide satisfactory proof of ownership or authorization as may be required to establish their connection to the wallet address in question. Failure to conclusively demonstrate such ownership or authority may result in denial of access to services, rights, or privileges associated with the wallet address under this Agreement.`

    documentText += `\n\n${clauseNumber++}. Amendments and Modifications:
This Agreement may be amended or modified only by a written document signed by both the Creator and the Owner(s) holding the relevant majority or super-majority share, as applicable.`

    documentText += `\n\n${clauseNumber++}. Proof of Ownership and Responsibility:
Each individual claiming ownership ("Claimant") must conclusively prove that they are the legitimate Owner or Creator of the specified wallet address associated with this Agreement. It is the sole responsibility of the Claimant to provide irrefutable evidence supporting their claim. This proof may include, but is not limited to, cryptographic signatures, transaction histories, and other blockchain-based verifications that establish an undeniable link between the Claimant and the wallet address in question. Failure to provide satisfactory evidence will result in the denial of any rights, privileges, or access purportedly associated with the wallet address under the terms of this Agreement.`

    documentText += `\n\n${clauseNumber++}. Limitation of Platform Responsibility:
This Agreement is entered into solely between the Creator and the Owner(s) of the Non-Fungible Token ("NFT") and the associated digital or physical artwork ("Work"). TEIA (teia.art), formally operating under TEIA DAO LLC, and its affiliated members, collectively referred to as "Platform," do not bear any responsibility for the enforcement, execution, or maintenance of this Agreement. The Platform serves only as a venue for the creation, display, and trading of NFTs and does not participate in any legal relationships established under this Agreement between the Creator and the Owner(s). All responsibilities related to the enforcement and adherence to the terms of this Agreement rest solely with the Creator and the Owner(s). The Platform disclaims all liability for any actions or omissions of any user related to the provisions of this Agreement.`
    setGeneratedDocument(documentText)
  }, [address, clauseNumber, clauses, minterName])

  const handleChange = (value, name) => {
    const newValue = Object.prototype.hasOwnProperty.call(value, 'value')
      ? value.value
      : value

    // If 'Release to Public Domain' is checked, disable and reset other clauses
    if (name === 'releasePublicDomain' && newValue === true) {
      setClauses({
        reproduce: false,
        broadcast: false,
        publicDisplay: false,
        createDerivativeWorks: false,
        exclusiveRights: 'none',
        releasePublicDomain: true,
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
  }

  return (
    <div>
      <h4>Custom License Generation Form</h4>
      <form>
        {Object.keys(clauses)
          .filter((name) => name !== 'exclusiveRights')
          .map((clauseName) => (
            <Checkbox
              key={clauseName}
              name={clauseName}
              label={clauseLabels[clauseName]}
              checked={clauses[clauseName]}
              onCheck={(checked) => handleChange(checked, clauseName)}
              disabled={
                clauseName === 'releasePublicDomain'
                  ? clauses.releasePublicDomain
                  : false
              }
            />
          ))}
        <div className="select-container" style={{ marginTop: '20px' }}>
          <label>{clauseLabels.exclusiveRights}</label>
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
              !Object.values(clauses).some(
                (value) => value === true && value !== 'none'
              )
            }
            styles={select_style}
            theme={theme}
            className={styles.container}
            classNamePrefix="react_select"
          />
        </div>
      </form>
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
