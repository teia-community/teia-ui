import { useEffect, useRef, useState } from 'react'
import { Button } from '@atoms/button'
import { Identicon } from '@atoms/identicons'
import styles from '@style'

/**
 * Collab & Channels picker.
 * Selected state lives in the parent's
 * `values.channels` / `values.collabs`.
 *
 * @param {{
 *   title: string,
 *   items: Array<{ key: string, name: string, meta?: string, image?: string, address?: string, logo?: string }>,
 *   loading?: boolean,
 *   error?: unknown,
 *   emptyMessage: string,
 *   gateMessage?: string,
 *   selectedKeys: Set<string>,
 *   onToggle: (item: object, nowSelected: boolean) => void,
 *   onClose: () => void,
 *   query?: string,
 *   onQueryChange?: (q: string) => void,
 *   searching?: boolean,
 *   searchPlaceholder?: string,
 * }} props
 */
export default function RelatedPicker({
  title,
  items,
  loading,
  error,
  emptyMessage,
  gateMessage,
  selectedKeys,
  onToggle,
  onClose,
  query,
  onQueryChange,
  searching,
  searchPlaceholder,
}) {
  const dialogRef = useRef(null)
  const [internalQuery, setInternalQuery] = useState('')
  const controlled = query !== undefined
  const shownQuery = controlled ? query : internalQuery

  useEffect(() => {
    dialogRef.current?.showModal()
    // The parent event-modal has a document-level keydown trap (Escape closes
    // the whole form, Tab wraps focus) that must never see keys typed here.
    // This dialog also lives inside the event <form>, so Enter in the filter
    // input must not trigger the form's implicit submission.
    const guard = (e) => {
      e.stopPropagation()
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        e.preventDefault()
      }
    }
    const dialog = dialogRef.current
    dialog?.addEventListener('keydown', guard)
    return () => dialog?.removeEventListener('keydown', guard)
  }, [])

  const filtered = controlled
    ? items || []
    : (items || []).filter((item) =>
        item.name.toLowerCase().includes(internalQuery.trim().toLowerCase())
      )

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onMouseDown={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      className={styles.picker}
      aria-label={`Link ${title.toLowerCase()}`}
    >
      <div className={styles.picker_head}>
        <h3 className={styles.picker_title}>{title}</h3>
        <Button
          small
          secondary
          type="button"
          onClick={() => dialogRef.current?.close()}
        >
          Done
        </Button>
      </div>

      {(controlled || (items || []).length > 5) && (
        <input
          type="search"
          // eslint-disable-next-line jsx-a11y/no-autofocus -- renders inside a native <dialog> opened via showModal(); autofocusing the filter is expected modal UX.
          autoFocus
          className={styles.picker_search}
          placeholder={searchPlaceholder || 'Filter by name…'}
          aria-label={`Filter ${title.toLowerCase()}`}
          value={shownQuery}
          onChange={(e) =>
            controlled
              ? onQueryChange?.(e.target.value)
              : setInternalQuery(e.target.value)
          }
        />
      )}

      {gateMessage ? (
        <p className={styles.picker_state}>{gateMessage}</p>
      ) : loading ? (
        <p className={styles.picker_state}>Loading …</p>
      ) : error ? (
        <p className={styles.picker_state}>
          Couldn't load {title.toLowerCase()}. {error.message}
        </p>
      ) : controlled && searching ? (
        <p className={styles.picker_state}>Searching…</p>
      ) : (items || []).length === 0 ? (
        <p className={styles.picker_state}>{emptyMessage}</p>
      ) : !controlled && filtered.length === 0 ? (
        <p className={styles.picker_state}>No matches.</p>
      ) : (
        <ul className={styles.picker_list}>
          {filtered.map((item) => (
            <li key={item.key}>
              <label className={styles.picker_row}>
                <input
                  type="checkbox"
                  checked={selectedKeys.has(item.key)}
                  onChange={(e) => onToggle(item, e.target.checked)}
                />
                {item.image ? (
                  <span className={styles.picker_thumb}>
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </span>
                ) : item.address ? (
                  <span className={styles.picker_thumb}>
                    <Identicon address={item.address} logo={item.logo} />
                  </span>
                ) : (
                  <span className={styles.picker_thumb} aria-hidden="true" />
                )}
                <span className={styles.picker_row_text}>
                  <span className={styles.picker_row_name}>{item.name}</span>
                  {item.meta && (
                    <span className={styles.picker_row_meta}>{item.meta}</span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  )
}
