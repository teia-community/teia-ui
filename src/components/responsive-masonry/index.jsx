import { useCallback, useEffect, useRef, useState } from 'react'
import Masonry from 'react-masonry-css'
import styles from '@style'
import { useVirtualList } from '@hooks/use-virtual-list'

export const useMasonryColumns = () => {
  const getColumns = () => {
    if (global.innerWidth > 1170) {
      return 4
    }

    if (global.innerWidth > 744) {
      return 3
    }
    if (global.innerWidth > 320) {
      return 2
    }

    return 1
  }
  const [colums, setColumns] = useState(getColumns())

  useEffect(() => {
    const resize = () => {
      setColumns(getColumns())
    }
    global.addEventListener('resize', resize)

    return () => global.removeEventListener('resize', resize)
  }, [])

  return colums
}

export const ResponsiveMasonry = ({ children, columns }) => {
  const defaultColumns = useMasonryColumns()
  const colums = columns ?? defaultColumns

  return (
    <Masonry
      // cellSpacing={150}
      breakpointCols={colums}
      className={`${styles.grid} no-fool`}
      columnClassName={styles.column}
    >
      {children}
    </Masonry>
  )
}

/**
 * Window-scrolled virtual list: only rows near the viewport are mounted.
 * `getKey(item)` must be stable per item; `estimateSize` is the px height
 * assumed for rows not yet measured.
 */
export function VirtualColumn({
  items,
  getKey,
  renderItem,
  estimateSize,
  rowClassName = '',
  anchorScroll = true,
}) {
  const listRef = useRef(null)
  const getIndexKey = useCallback((i) => getKey(items[i]), [items, getKey])
  const {
    items: rows,
    totalSize,
    measureElement,
  } = useVirtualList({
    count: items.length,
    getKey: getIndexKey,
    estimateSize,
    listRef,
    anchorScroll,
  })

  return (
    <div
      ref={listRef}
      className={styles.virtual_spacer}
      style={{ height: totalSize }}
    >
      {rows.map(({ index, key, start }) => (
        <div
          key={key}
          ref={measureElement}
          data-index={index}
          className={`${styles.virtual_row} ${rowClassName}`}
          style={{ transform: `translateY(${start}px)` }}
        >
          {renderItem(items[index])}
        </div>
      ))}
    </div>
  )
}

/**
 * Same column layout as ResponsiveMasonry (item i goes to column i % n,
 * like react-masonry-css), with each column virtualized on its own.
 */
export const VirtualMasonry = ({ items, getKey, renderItem, estimateSize }) => {
  const colums = useMasonryColumns()
  const columnItems = Array.from({ length: colums }, (_, c) =>
    items.filter((_, i) => i % colums === c)
  )

  return (
    <div className={`${styles.grid} no-fool`}>
      {columnItems.map((column, c) => (
        <div
          key={c}
          className={styles.column}
          style={{ width: `${100 / colums}%` }}
        >
          <VirtualColumn
            items={column}
            getKey={getKey}
            renderItem={renderItem}
            estimateSize={estimateSize}
            rowClassName={styles.virtual_tile}
            anchorScroll={false}
          />
        </div>
      ))}
    </div>
  )
}
