import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '@atoms/button/Button'
import { Loading } from '@atoms/loading'
import { fetchTokensMetadataBatch } from '@data/swr'
import TokenCard from './TokenCard'
import type { NFTMetadata } from './CopyrightTypes'
import styles from './index.module.scss'

const WORKS_PER_PAGE = 12

interface RegisteredWorksProps {
  nfts: Array<{ contract: string; token_id: string }>
}

/**
 * Renders a copyright's registered works, batching metadata requests and
 * paginating with a "Load More" button. Mounted only inside an expanded
 * copyright, so fetching happens on open (not on page load), and a large
 * copyright loads its works a page at a time.
 */
export default function RegisteredWorks({ nfts }: RegisteredWorksProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [meta, setMeta] = useState<Map<string, NFTMetadata>>(new Map())
  const [loading, setLoading] = useState(false)

  // Fetch metadata for the next page, then reveal it (fetch-before-reveal so a
  // card's metadata is present by the time it renders).
  const loadNextPage = useCallback(
    async (from: number) => {
      const slice = nfts.slice(from, from + WORKS_PER_PAGE)
      if (slice.length === 0) return
      setLoading(true)
      const batch = await fetchTokensMetadataBatch(
        slice.map((nft) => ({ contract: nft.contract, tokenId: nft.token_id }))
      )
      setMeta((prev) => new Map([...prev, ...batch]))
      setVisibleCount(from + slice.length)
      setLoading(false)
    },
    [nfts]
  )

  // Load the first page once, when the works become visible.
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current || nfts.length === 0) return
    initialized.current = true
    loadNextPage(0)
  }, [nfts, loadNextPage])

  const hasMore = visibleCount < nfts.length

  return (
    <>
      <div className={styles.tokensGrid}>
        {nfts.slice(0, visibleCount).map((nft) => (
          <TokenCard
            key={`${nft.contract}:${nft.token_id}`}
            contract={nft.contract}
            tokenId={nft.token_id}
            metadata={meta.get(`${nft.contract}:${nft.token_id}`)}
            managed
          />
        ))}
      </div>
      {(hasMore || loading) && (
        <div className={styles.worksLoadMore}>
          {loading ? (
            <Loading message="Loading works..." />
          ) : (
            <Button onClick={() => loadNextPage(visibleCount)} shadow_box>
              Load More ({nfts.length - visibleCount})
            </Button>
          )}
        </div>
      )}
    </>
  )
}
