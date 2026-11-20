import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/**
 * Minimal vertical virtualizer (same idea as @tanstack/react-virtual).
 * Rows start at `estimateSize` px and are re-measured with a ResizeObserver
 * once rendered, so variable-height rows work. `getKey` must be stable
 * (useCallback) since measurements are cached by key.
 *
 * Scrolls inside `scrollRef` when given, otherwise with the window; either
 * way `listRef` is the spacer element: give it `totalSize` px of height and
 * absolutely position each item at `start`, with `ref={measureElement}` and
 * `data-index={index}`. Re-renders only when the visible range changes.
 *
 * `anchorScroll` compensates scroll when rows above the fold resize. Turn it
 * off when several lists share the window scroll (masonry columns): moving
 * the window for one column would shift all the others.
 */
export function useVirtualList({
  count,
  getKey,
  estimateSize,
  overscan = 6,
  scrollRef,
  listRef,
  anchorScroll = true,
}) {
  const sizes = useRef(new Map())
  const [version, setVersion] = useState(0)
  const [range, setRange] = useState({ first: 0, last: -1 })

  const layout = useMemo(() => {
    const starts = new Array(count)
    let total = 0
    for (let i = 0; i < count; i++) {
      starts[i] = total
      total += sizes.current.get(getKey(i))?.size ?? estimateSize
    }
    return { starts, total }
    // `version` bumps whenever a measurement lands in `sizes`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, getKey, estimateSize, version])

  const layoutRef = useRef(layout)
  layoutRef.current = layout

  // Visible window in list coordinates.
  const getViewport = useCallback(() => {
    const scrollEl = scrollRef?.current
    if (scrollEl)
      return { top: scrollEl.scrollTop, height: scrollEl.clientHeight }
    const listEl = listRef.current
    if (!listEl) return { top: 0, height: 0 }
    return {
      top: -listEl.getBoundingClientRect().top,
      height: window.innerHeight,
    }
  }, [scrollRef, listRef])

  const update = useCallback(() => {
    const { starts, total } = layoutRef.current
    const n = starts.length
    if (!n) return setRange({ first: 0, last: -1 })
    const { top, height } = getViewport()

    // First row whose bottom edge is below the viewport top.
    let lo = 0
    let hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      const end = mid + 1 < n ? starts[mid + 1] : total
      if (end <= top) lo = mid + 1
      else hi = mid
    }
    let last = lo
    while (last + 1 < n && starts[last + 1] < top + height) last++

    const first = Math.max(0, lo - overscan)
    last = Math.min(n - 1, last + overscan)
    setRange((r) =>
      r.first === first && r.last === last ? r : { first, last }
    )
  }, [getViewport, overscan])

  // Row sizes/count changed: the same scroll offset may cover other rows.
  useLayoutEffect(update, [update, layout])

  useLayoutEffect(() => {
    const target = scrollRef?.current ?? window
    const resize = new ResizeObserver(update)
    resize.observe(scrollRef?.current ?? document.documentElement)
    target.addEventListener('scroll', update, { passive: true })
    return () => {
      resize.disconnect()
      target.removeEventListener('scroll', update)
    }
  }, [scrollRef, update])

  const getKeyRef = useRef(getKey)
  getKeyRef.current = getKey

  const observer = useRef(null)
  if (!observer.current && typeof ResizeObserver !== 'undefined') {
    observer.current = new ResizeObserver((entries) => {
      let changed = false
      let shift = 0
      const viewTop = getViewport().top
      for (const entry of entries) {
        const el = entry.target
        // Unmounted rows report 0 once; drop them instead of caching that.
        if (!el.isConnected) {
          observer.current.unobserve(el)
          continue
        }
        const index = Number(el.dataset.index)
        const key = getKeyRef.current(index)
        const box = entry.borderBoxSize?.[0]
        const size = box?.blockSize ?? el.offsetHeight
        const width = box?.inlineSize ?? el.offsetWidth
        const cached = sizes.current.get(key)
        const prev = cached?.size ?? estimateSize
        // A remounted row can briefly render smaller (lazy image placeholder
        // before the image decodes). At the same width, keep its measured
        // slot so rows below it don't jump up and back down.
        if (size === prev || (cached?.width === width && size < prev)) continue

        // A row above the fold changed height: shift scroll by the same
        // amount so the visible rows don't jump.
        if (anchorScroll && layoutRef.current.starts[index] < viewTop)
          shift += size - prev
        sizes.current.set(key, { size, width })
        changed = true
      }
      if (shift) {
        if (scrollRef?.current) scrollRef.current.scrollTop += shift
        else window.scrollBy(0, shift)
      }
      if (changed) setVersion((v) => v + 1)
    })
  }

  useEffect(() => () => observer.current?.disconnect(), [])

  const measureElement = useCallback((el) => {
    if (el) observer.current?.observe(el)
  }, [])

  const items = []
  for (let i = range.first; i <= Math.min(range.last, count - 1); i++) {
    items.push({ index: i, key: getKey(i), start: layout.starts[i] })
  }

  return { items, totalSize: layout.total, measureElement }
}

export default useVirtualList
