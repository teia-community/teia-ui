import { useState, useEffect } from 'react'
import { HashToURL } from '@utils'
import { HEN_CONTRACT_FA2 } from '@constants'
import { fetchTokenMetadataForCopyrightSearch } from '@data/swr'
import type { NFTMetadata } from './CopyrightTypes'
import styles from './index.module.scss'

interface TokenCardProps {
  contract: string
  tokenId: string
  metadata?: NFTMetadata
  managed?: boolean
}

export default function TokenCard({ contract, tokenId, metadata, managed }: TokenCardProps) {
  const [meta, setMeta] = useState<NFTMetadata>(metadata || {})

  // Sync local state when the parent supplies/updates metadata.
  useEffect(() => {
    if (metadata) setMeta(metadata)
  }, [metadata])

  useEffect(() => {
    // Parent-managed cards wait for the batched result; they never self-fetch.
    if (managed || metadata) return
    fetchTokenMetadataForCopyrightSearch(contract, tokenId)
      .then((data) => setMeta(data?.metadata || {}))
      .catch(() => setMeta({}))
  }, [contract, tokenId, metadata, managed])

  const imageSrc =
    (meta.thumbnailUri && HashToURL(meta.thumbnailUri, 'IPFS')) ||
    (meta.displayUri && HashToURL(meta.displayUri, 'IPFS')) ||
    (meta.artifactUri && HashToURL(meta.artifactUri, 'IPFS'))

  const isHen = contract === HEN_CONTRACT_FA2
  const link = isHen
    ? `/objkt/${tokenId}`
    : `https://tzkt.io/${contract}/tokens/${tokenId}/metadata`

  return (
    <div className={styles.tokenCard}>
      {imageSrc ? (
        <img src={imageSrc} alt={meta.name || 'Artwork'} className={styles.tokenThumb} />
      ) : (
        <div className={styles.tokenThumb} />
      )}
      <div className={styles.tokenInfo}>
        <div className={styles.tokenName}>{meta.name || `Token #${tokenId}`}</div>
        <div className={styles.tokenArtist}>
          {contract.slice(0, 8)}.../{tokenId}
        </div>
        {isHen ? (
          <a href={link} className={styles.tokenLink}>View on Teia</a>
        ) : (
          <a href={link} target="_blank" rel="noreferrer" className={styles.tokenLink}>View on TzKT</a>
        )}
      </div>
    </div>
  )
}
