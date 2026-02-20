import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router'
import { fetchUserCopyrights, fetchCreatorAliases, fetchTokenMetadataForCopyrightSearch } from '@data/swr'
import { HashToURL } from '@utils'
import { Loading } from '@atoms/loading'
import type { CopyrightEntry } from '../shared/CopyrightTypes'
import ClausesPreview from '../shared/ClausesPreview'
import TokenCard from '../shared/TokenCard'
import AgreementViewer from '../shared/AgreementViewer'
import styles from './index.module.scss'
import sharedStyles from '../shared/index.module.scss'

export default function CopyrightDisplay() {
  const { address } = useOutletContext<{ address: string }>()
  const [records, setRecords] = useState<CopyrightEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [aliases, setAliases] = useState<Map<string, string>>(new Map())
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showFullText, setShowFullText] = useState<Record<number, boolean>>({})
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [tokenMeta, setTokenMeta] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!address) return

    setLoading(true)
    fetchUserCopyrights(address).then(async (data: CopyrightEntry[]) => {
      setRecords(data)
      setLoading(false)

      const addresses = [...new Set(data.map((e) => e.key.address))]
      fetchCreatorAliases(addresses).then(setAliases)

      // Fetch thumbnails for all NFTs across all entries
      const allNfts = data.flatMap((e) =>
        e.value.related_tezos_nfts.map((nft) => ({ ...nft, entryId: e.id }))
      )
      const thumbResults = await Promise.allSettled(
        allNfts.map(async (nft) => {
          const meta = await fetchTokenMetadataForCopyrightSearch(nft.contract, nft.token_id)
          const md = meta?.metadata || {}
          const src =
            (md.thumbnailUri && HashToURL(md.thumbnailUri, 'IPFS')) ||
            (md.displayUri && HashToURL(md.displayUri, 'IPFS')) ||
            (md.artifactUri && HashToURL(md.artifactUri, 'IPFS'))
          return { key: `${nft.contract}:${nft.token_id}`, src, md }
        })
      )
      const thumbMap: Record<string, string> = {}
      const metaMap: Record<string, any> = {}
      thumbResults.forEach((r) => {
        if (r.status === 'fulfilled') {
          if (r.value.src) thumbMap[r.value.key] = r.value.src
          metaMap[r.value.key] = r.value.md
        }
      })
      setThumbnails(thumbMap)
      setTokenMeta(metaMap)
    })
  }, [address])

  if (loading) return <Loading message="Loading copyrights..." />

  if (records.length === 0) {
    return <div className={sharedStyles.emptyState}>No copyright registrations found.</div>
  }

  const nftCount = (entry: CopyrightEntry) => entry.value.related_tezos_nfts.length

  // Bento sizing based on content richness
  const bentoSize = (entry: CopyrightEntry, idx: number) => {
    if (nftCount(entry) >= 3 || entry.value.clauses.addendum) return styles.bentoLarge
    if (idx % 5 === 0) return styles.bentoWide
    return ''
  }

  return (
    <div className={styles.container}>
      <div className={styles.bento}>
        {records.map((entry, idx) => {
          const isExpanded = expandedId === entry.id
          const clauses = entry.value.clauses
          const works = nftCount(entry)
          const displayName = aliases.get(entry.key.address) || `${entry.key.address.slice(0, 8)}...${entry.key.address.slice(-4)}`

          return (
            <div
              key={entry.id}
              className={`${styles.bentoTile} ${isExpanded ? styles.bentoExpanded : bentoSize(entry, idx)}`}
            >
              <button
                className={styles.bentoButton}
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                aria-expanded={isExpanded}
              >
                <div className={styles.bentoHeader}>
                  <span className={styles.bentoTitle}>
                    #{entry.key.nat} {displayName}
                  </span>
                  {!entry.value.active && (
                    <span className={styles.inactiveLabel}>Inactive</span>
                  )}
                </div>

                <div className={styles.bentoInfo}>
                  <span>{works} registered work{works !== 1 ? 's' : ''}</span>
                  {clauses.exclusiveRights && (
                    <>
                      <span className={styles.infoDot} />
                      <span>Rights: {clauses.exclusiveRights}</span>
                    </>
                  )}
                </div>

                {works > 0 && (
                  <div className={styles.thumbStrip}>
                    {entry.value.related_tezos_nfts.map((nft) => {
                      const key = `${nft.contract}:${nft.token_id}`
                      const src = thumbnails[key]
                      return src ? (
                        <img key={key} src={src} alt="" className={styles.thumbImg} />
                      ) : (
                        <div key={key} className={styles.thumbPlaceholder} />
                      )
                    })}
                  </div>
                )}

                <div className={styles.bentoBottom}>
                  <ClausesPreview clauses={clauses} compact />
                  <span className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ''}`}>+</span>
                </div>
              </button>

              {isExpanded && (
                <div className={styles.expandedDetails}>
                  <h4 className={sharedStyles.sectionTitle}>Clauses</h4>
                  <div className={sharedStyles.clauseGrid}>
                    {[
                      { key: 'reproduce', label: 'Reproduce' },
                      { key: 'broadcast', label: 'Broadcast' },
                      { key: 'publicDisplay', label: 'Public Display' },
                      { key: 'createDerivativeWorks', label: 'Derivative Works' },
                      { key: 'requireAttribution', label: 'Attribution Required' },
                      { key: 'rightsAreTransferable', label: 'Transferable' },
                      { key: 'retainCreatorRights', label: 'Retain Creator Rights' },
                      { key: 'releasePublicDomain', label: 'Public Domain' },
                    ].map(({ key, label }) => {
                      const val = clauses[key as keyof typeof clauses]
                      if (typeof val !== 'boolean') return null
                      return (
                        <div key={key} className={sharedStyles.clauseItem}>
                          <span className={sharedStyles.clauseLabel}>{label}</span>
                          <span className={val ? sharedStyles.clauseAllowed : sharedStyles.clauseDenied}>
                            {val ? 'Allowed' : 'Denied'}
                          </span>
                        </div>
                      )
                    })}
                    <div className={sharedStyles.clauseItem}>
                      <span className={sharedStyles.clauseLabel}>Exclusive Rights</span>
                      <span className={sharedStyles.clauseValue}>{clauses.exclusiveRights}</span>
                    </div>
                  </div>

                  {entry.value.related_tezos_nfts.length > 0 && (
                    <>
                      <h4 className={sharedStyles.sectionTitle}>Registered Works</h4>
                      <div className={sharedStyles.tokensGrid}>
                        {entry.value.related_tezos_nfts.map((nft) => (
                          <TokenCard
                            key={`${nft.contract}:${nft.token_id}`}
                            contract={nft.contract}
                            tokenId={nft.token_id}
                            metadata={tokenMeta[`${nft.contract}:${nft.token_id}`]}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {clauses.firstParagraph && (
                    <>
                      <h4 className={sharedStyles.sectionTitle}>Agreement</h4>
                      <p className={sharedStyles.agreementText}>{clauses.firstParagraph}</p>
                    </>
                  )}

                  <p className={sharedStyles.registrarLine}>Registrar: {entry.key.address}</p>

                  {entry.value.related_external_nfts.length > 0 && (
                    <div className={sharedStyles.externalLinks}>
                      <h4 className={sharedStyles.sectionTitle}>External Registrations</h4>
                      {entry.value.related_external_nfts.map((url, i) => (
                        <div key={i}>
                          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                        </div>
                      ))}
                      <p className={sharedStyles.externalNote}>
                        External URLs and URIs must be proven and maintained by the registrar.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowFullText((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                    className={sharedStyles.fullTextButton}
                  >
                    {showFullText[entry.id] ? 'Hide Full Text' : 'Generate Full Text'}
                  </button>
                  {showFullText[entry.id] && <AgreementViewer firstParagraph={clauses.firstParagraph} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
