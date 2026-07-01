import { useMemo, useState } from 'react'
import { Button } from '@atoms/button'
import styles from '@style'

/**
 * Shared moderation table with a search box and a "hidden only" filter.
 */
export default function ModerationTable({
  items = [],
  headers,
  renderRow,
  searchText,
  emptyLabel = 'Nothing to show.',
}) {
  const [query, setQuery] = useState('')
  const [hiddenOnly, setHiddenOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (hiddenOnly && !it.hidden) return false
      if (!q) return true
      return (searchText?.(it) ?? '').toLowerCase().includes(q)
    })
  }, [items, query, hiddenOnly, searchText])

  return (
    <>
      <div className={styles.table_controls}>
        <input
          type="search"
          className={styles.input}
          placeholder="Filter by author or content…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          small
          shadow_box
          selected={hiddenOnly}
          onClick={() => setHiddenOnly((v) => !v)}
        >
          {hiddenOnly ? 'Show all' : 'Show hidden only'}
        </Button>
        <span className={styles.muted}>
          {filtered.length} of {items.length}
        </span>
      </div>

      <div className={styles.table_wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className={styles.empty}>
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              filtered.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
