import { useEffect, useRef } from 'react'

const MIN_ROWS = 10

/** Most pages fetched automatically per filter/sort; after that, "Load more". */
export const MAX_AUTO_PAGES = 5

/**
 * We need a new indexer
 *
 * Loads more pages while a filtered feed shows fewer than MIN_ROWS rows.
 * Some filters run in the browser (the market chips), so a combination that
 * never matches (e.g. Create + Secondary) would otherwise page through the
 * whole indexer history. Automatic loading stops after MAX_AUTO_PAGES pages;
 * the count starts again whenever `resetKey` (the active filters and sort)
 * changes. "Load more" still works past the cap.
 */
export default function useAutoLoadMore({
  rowCount,
  isLoadingInitial,
  isReachingEnd,
  isLoadingMore,
  loadMore,
  resetKey = '',
}) {
  const auto = useRef({ key: resetKey, pages: 0 })

  useEffect(() => {
    if (auto.current.key !== resetKey) {
      auto.current = { key: resetKey, pages: 0 }
    }
    if (isLoadingInitial || isReachingEnd || isLoadingMore) return
    if (rowCount >= MIN_ROWS) return
    if (auto.current.pages >= MAX_AUTO_PAGES) return
    auto.current.pages += 1
    loadMore()
  }, [
    rowCount,
    isLoadingInitial,
    isReachingEnd,
    isLoadingMore,
    loadMore,
    resetKey,
  ])
}
