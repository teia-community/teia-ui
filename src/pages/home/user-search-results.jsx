import get from 'lodash/get'
import { useSearchParams, Link } from 'react-router-dom'
import styles from '@style'
import { Identicon } from '@atoms/identicons'
import { Line } from '@atoms/line'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useVirtualList } from '@hooks/use-virtual-list'
import { useUserSearch } from '@data/search'

// 32px icon + 2x10px padding + 1px line; wrapped descriptions get measured.
const ROW_ESTIMATE = 53
// ~7 rows fit a 400px container; mount about one screen more, split
// above/below, so fast scrolling rarely shows blank space.
const OVERSCAN = 6
const SKELETON_ROWS = 8
// Old fixed height, kept as a floor on short viewports.
const MIN_HEIGHT = 400

// Max height that fills the viewport below the element's page position,
// re-measured when the window or content above it (e.g. filters) resizes.
function useFillHeight(ref) {
  const [height, setHeight] = useState(MIN_HEIGHT)
  useLayoutEffect(() => {
    const measure = () => {
      if (!ref.current) return
      const top = ref.current.getBoundingClientRect().top + window.scrollY
      setHeight(Math.max(MIN_HEIGHT, window.innerHeight - top))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])
  return height
}

function SkeletonRows() {
  return Array.from({ length: SKELETON_ROWS }, (_, i) => (
    <div key={i} className={styles.subjkt_result} aria-hidden="true">
      <div className={styles.flex}>
        <div className={styles.user_box}>
          <span className={`${styles.subjkt_icon} ${styles.skeleton}`} />
          <span
            className={`${styles.skeleton} ${styles.skeleton_name}`}
            style={{ width: `${45 + ((i * 37) % 40)}%` }}
          />
        </div>
        <div className={styles.description}>
          <span
            className={`${styles.skeleton} ${styles.skeleton_text}`}
            style={{ width: `${30 + ((i * 53) % 60)}%` }}
          />
        </div>
      </div>
      <Line />
    </div>
  ))
}

function UserSearchResults() {
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('term') || ''
  const { users: holders, isLagging } = useUserSearch(searchTerm)

  const skeletonRef = useRef(null)
  const skeletonHeight = useFillHeight(skeletonRef)

  // laggy keeps the previous term's rows around; don't show them as results.
  if (!holders || isLagging) {
    return (
      <div
        ref={skeletonRef}
        className={styles.container}
        style={{ maxHeight: skeletonHeight }}
        aria-busy="true"
      >
        <SkeletonRows />
      </div>
    )
  }

  if (!holders.length) {
    return (
      <div className={styles.empty_section}>
        <h1>no results</h1>
      </div>
    )
  }

  // Keyed by term so measurements and scroll position reset per search.
  return <VirtualSubjkts key={searchTerm} holders={holders} />
}

function VirtualSubjkts({ holders }) {
  const scrollRef = useRef(null)
  const getKey = useCallback((i) => holders[i].name, [holders])
  const { items, totalSize, measureElement } = useVirtualList({
    count: holders.length,
    getKey,
    estimateSize: ROW_ESTIMATE,
    overscan: OVERSCAN,
    scrollRef,
  })
  const maxHeight = useFillHeight(scrollRef)

  return (
    <div ref={scrollRef} className={styles.container} style={{ maxHeight }}>
      <div className={styles.virtual_spacer} style={{ height: totalSize }}>
        {items.map(({ index, key, start }) => {
          const { user_address, name, metadata } = holders[index]
          return (
            <div
              key={key}
              ref={measureElement}
              data-index={index}
              className={`${styles.subjkt_result} ${styles.virtual_row}`}
              style={{ transform: `translateY(${start}px)` }}
            >
              <div className={styles.flex}>
                <Link
                  className={styles.user_box}
                  to={`/${encodeURIComponent(name)}`}
                >
                  {metadata.data && (
                    <Identicon
                      className={styles.subjkt_icon}
                      address={user_address}
                      logo={metadata.data?.identicon}
                    />
                  )}
                  <p className={styles.user}>{name}</p>
                </Link>{' '}
                <p className={styles.description}>
                  {get(metadata, 'data.description')}
                </p>
              </div>
              <Line key={`${name}-line`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UserSearchResults
