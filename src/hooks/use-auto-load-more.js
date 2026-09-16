import { useEffect } from 'react'

const MIN_ROWS = 10

/**
 * We need a new indexer
 */
export default function useAutoLoadMore({
  rowCount,
  isLoadingInitial,
  isReachingEnd,
  isLoadingMore,
  loadMore,
}) {
  useEffect(() => {
    if (isLoadingInitial || isReachingEnd || isLoadingMore) return
    if (rowCount >= MIN_ROWS) return
    loadMore()
  }, [rowCount, isLoadingInitial, isReachingEnd, isLoadingMore, loadMore])
}
