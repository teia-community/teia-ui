'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@context/userStore'
import { fetchUserCopyrights, fetchTokenMetadata } from '@data/swr'
import { HashToURL } from '@utils'

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
  const address = useUserStore((state) => state.address)
  const [records, setRecords] = useState<CopyrightBigMapEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [metadataMap, setMetadataMap] = useState<Record<string, NFTMetadata>>({})

  useEffect(() => {
    if (!address) return

    setLoading(true)
    fetchUserCopyrights(address).then(async (data) => {
      const metaMap: Record<string, NFTMetadata> = {}

      for (const entry of data) {
        for (const nft of entry.value.related_tezos_nfts) {
          const key = `${nft.contract}:${nft.token_id}`
          if (!metaMap[key]) {
            try {
              const meta = await fetchTokenMetadata(nft.contract, nft.token_id)
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
      setLoading(false)
    })
  }, [address])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Your Registered Copyrights</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">No records found.</p>
      ) : (
        <div className="space-y-8">
          {records.map((entry, idx) => {
            const { value } = entry
            const nfts = value.related_tezos_nfts
            const extLinks = value.related_external_nfts

            return (
              <div key={idx} className="border rounded-lg p-4 shadow-sm">
                <h2 className="font-bold text-lg mb-1">Copyright #{entry.key.nat}</h2>
                <p className="text-xs text-gray-400 mb-2">Creator: {entry.key.address}</p>

                {nfts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                          className="border rounded-md overflow-hidden bg-white shadow"
                        >
                          <img
                            src={imageSrc}
                            alt={meta.name || 'Artwork'}
                            className="w-full h-48 object-cover bg-gray-100"
                          />
                          <div className="p-3">
                            ☑️ TEIA Verified 
                            ✅ Tezos Verified
                            <h3 className="font-medium text-sm truncate">
                              {meta.name || `Token #${nft.token_id}`}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">
                              {meta.description || 'No description.'}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {nft.contract} / #{nft.token_id}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {value?.clauses && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold mb-1">Clauses:</h4>
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
                <p className="text-sm text-gray-700 mb-1">
                  <strong>First Paragraph:</strong> {value.clauses.firstParagraph}
                </p>
                <p className="text-sm mb-1">
                  <strong>Exclusive Rights:</strong> {value.clauses.exclusiveRights}
                </p>
                <p className="text-xs text-gray-400 mt-1 mb-2">
                  Status: {value.active ? 'Active' : 'Inactive'}
                </p>

                {extLinks.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">External References:</p>
                    {extLinks.map((url, i) => (
                      <>
                        ⚠️ External Link
                        <a

                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm underline block truncate"
                        >
                          {url}
                        </a>
                      </>
                    ))}
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
