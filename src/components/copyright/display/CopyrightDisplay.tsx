'use client'

import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router'
import { fetchUserCopyrights, fetchTokenMetadataForCopyrightSearch } from '@data/swr'
import { HashToURL } from '@utils'
import styles from './index.module.css'
import { HEN_CONTRACT_FA2 } from '@constants'
import AgreementViewer from './AgreementViewer'

interface TezosNFTReference {
  contract: string
  token_id: string
}

interface NFTMetadata {
  name?: string
  description?: string
  thumbnailUri?: string
  displayUri?: string
  artifactUri?: string
}

interface CopyrightClauses {
  reproduce: boolean
  broadcast: boolean
  publicDisplay: boolean
  createDerivativeWorks: boolean
  exclusiveRights: string
  retainCreatorRights: boolean
  releasePublicDomain: boolean
  requireAttribution: boolean
  rightsAreTransferable: boolean
  expirationDate: string | null
  expirationDateExists: boolean
  customUriEnabled: boolean
  customUri: string | null
  addendum: string | null
  firstParagraph: string
}

interface CopyrightValue {
  active: boolean
  clauses: CopyrightClauses
  creators: string[]
  parent_registery: number | null
  related_tezos_nfts: TezosNFTReference[]
  related_external_nfts: string[]
}

interface CopyrightBigMapEntry {
  id: number
  active: boolean
  hash: string
  key: {
    address: string
    nat: string
  }
  value: CopyrightValue
  firstLevel: number
  lastLevel: number
  updates: number
}

export default function CopyrightDisplay() {
  const { address } = useOutletContext<{ address: string }>()
  const [records, setRecords] = useState<CopyrightBigMapEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [metadataMap, setMetadataMap] = useState<Record<string, NFTMetadata>>({})
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showFullText, setShowFullText] = useState<Record<number, boolean>>({});

  const toggleItem = (id: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  useEffect(() => {
    if (!address) return

    setLoading(true)
    fetchUserCopyrights(address).then(async (data) => {
      const metaMap: Record<string, NFTMetadata> = {}
      const initialExpandedState: Record<number, boolean> = {}

      for (const entry of data) {
        initialExpandedState[entry.id] = false
        for (const nft of entry.value.related_tezos_nfts) {
          const key = `${nft.contract}:${nft.token_id}`
          if (!metaMap[key]) {
            try {
              const meta = await fetchTokenMetadataForCopyrightSearch(nft.contract, nft.token_id)
              metaMap[key] = meta?.metadata || {}
            } catch (err) {
              console.warn(`Failed to fetch metadata for ${key}`, err)
              metaMap[key] = {}
            }
          }
        }
      }

      setMetadataMap(metaMap)
      setRecords(data)
      setExpandedItems(initialExpandedState)
      setLoading(false)
    })
  }, [address])

  return (
    <div className={styles.mainContainer}>
      <h1>©️ Registered Copyrights</h1>
      <br />
      {loading ? (
        <p>Loading...</p>
      ) : records.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <div className={styles.assetContainer}>
          {records.map((entry, idx) => {
            const { value } = entry
            const nfts = value.related_tezos_nfts
            const extLinks = value.related_external_nfts

            return (
              <div key={entry.id}>
                <button
                  className={styles.copyrightListItem}
                  onClick={() => toggleItem(entry.id)}
                  aria-expanded={expandedItems[entry.id]}
                  aria-controls={`copyright-content-${entry.id}`}
                >
                  <h2>Copyright #{entry.key.nat}
                      {expandedItems[entry.id] ? '▼' : '▶'}
                  </h2>
                  {nfts.length > 0 && metadataMap[`${nfts[0].contract}:${nfts[0].token_id}`]?.name && (
                    <h4>
                      {metadataMap[`${nfts[0].contract}:${nfts[0].token_id}`].name}
                    </h4>
                  )}
                  <p>
                    {value.active ? '🟢Active' : '🔴Inactive'}
                  </p>
                </button>
                {expandedItems[entry.id] && (
                  <div className={styles.agreementDetails}>
                    <h2>Registered Works</h2>
                    <br />
                    {nfts.length > 0 && (
                      <div className={styles.nftContainer}>
                        {nfts.map((nft) => {
                          const key = `${nft.contract}:${nft.token_id}`
                          const meta = metadataMap[key] || {}
                          const imageSrc =
                            (meta.thumbnailUri && HashToURL(meta.thumbnailUri, 'IPFS')) ||
                            (meta.displayUri && HashToURL(meta.displayUri, 'IPFS')) ||
                            (meta.artifactUri && HashToURL(meta.artifactUri, 'IPFS'))

                          return (
                            <div
                              key={key}
                              className={styles.nftImageWrapper}
                            >
                              <img
                                src={imageSrc}
                                alt={meta.name || 'Artwork'}
                                className={styles.nftImage}
                              />
                              <div className={styles.nftDetails}>
                                <h3>
                                  {meta.name || `Token #${nft.token_id}`}
                                </h3>
                                <p>
                                  Contract/ID: {nft.contract} / #{nft.token_id}
                                  <br />
                                  {nft.contract === HEN_CONTRACT_FA2 && (
                                    <span className="ml-1">
                                      ☑️ TEIA Verified <a href={`/objkt/${nft.token_id}`} target="_blank" rel="noreferrer">[Link]</a>
                                    </span>
                                  )}
                                  {nft.contract.startsWith("KT1") && nft.contract !== "KT1whoa" && (
                                    <span className="ml-1"> (✅ Tezos Verified)</span>
                                  )}
                                </p>
                                <br />
                                <p className={styles.descriptionPreview}>
                                  {meta.description || 'No description.'}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <br />
                    <h3>Clauses</h3>
                    {value?.clauses && (
                      <div className="mt-3">
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {Object.entries(value.clauses).map(([key, val]) => {
                            if (key === 'firstParagraph') return null

                            let label = key.replace(/([A-Z])/g, ' $1')
                            label = label.charAt(0).toUpperCase() + label.slice(1)

                            if (key === 'customUri' && val) {
                              return (
                                <li key={key}>
                                  {label}:{' '}
                                  <a
                                    href={val as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    {val}
                                  </a>
                                </li>
                              )
                            }

                            return (
                              <li key={key}>
                                {label}: {typeof val === 'boolean' ? (val ? '✅ Yes' : '❌ No') : val || '—'}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                    <br />
                    <h3>Agreement Details</h3>
                    <br />
                    <div className={styles.agreementText}>
                      <p>
                        {value.clauses.firstParagraph}
                      </p>
                    </div>
                    <br />
                    <p>Registrar Address: {entry.key.address}</p>
                    <br />
                    <p>
                      <strong>Exclusive Rights:</strong> {value.clauses.exclusiveRights}
                    </p>
                    <p>
                      <strong>Status:</strong> {value.active ? '🟢Active' : '🔴Inactive'}
                    </p>
                    {extLinks.length > 0 && (
                      <div className="mt-2">
                        <br />
                        <p><strong>External Registration Item(s):</strong></p>
                        {extLinks.map((url, i) => (
                          <div key={i}>
                            ⚠️ External Link:{" "}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {url}
                            </a>
                          </div>
                        ))}
                        <br />
                        <p>*Registration of external URLs and URIs must be proven and maintained by the registrar.</p>
                      </div>
                    )}
                    <br/>
                    <button
                      onClick={() => setShowFullText(prev => ({...prev, [entry.id]: !prev[entry.id]}))}
                      className={styles.fullTextButton}
                    >
                      {showFullText[entry.id] ? '🚫 Hide Full Text' : '🖨️ Generate Full Text'}
                    </button>
                    {showFullText[entry.id] && <AgreementViewer firstParagraph={value?.clauses.firstParagraph} />}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}