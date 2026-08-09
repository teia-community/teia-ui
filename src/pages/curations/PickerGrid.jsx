import { memo } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { tokenKey, pickerThumb } from '@data/curations'
import styles from '@style'

const PickerTile = memo(function PickerTile({ token, selected, onToggle }) {
  const thumb = pickerThumb(token)
  return (
    <button
      type="button"
      className={`${styles.picker_item} ${
        selected ? styles.picker_selected : ''
      }`}
      onClick={() => onToggle(token)}
      title={token.name}
    >
      {thumb && <LazyLoadImage src={thumb} alt="" decoding="async" />}
      {selected && <span className={styles.picker_check}>✓</span>}
      <span className={styles.picker_name}>{token.name}</span>
    </button>
  )
})

const PickerGrid = memo(function PickerGrid({
  tokens,
  selectedKeys,
  onToggle,
}) {
  if (!tokens.length) {
    return <p className={styles.empty}>No tokens found.</p>
  }
  return (
    <div className={styles.picker_grid}>
      {tokens.map((token) => {
        const key = tokenKey(token)
        return (
          <PickerTile
            key={key}
            token={token}
            selected={selectedKeys.has(key)}
            onToggle={onToggle}
          />
        )
      })}
    </div>
  )
})

export default PickerGrid
