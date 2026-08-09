import { LazyLoadImage } from 'react-lazy-load-image-component'
import { tokenKey, pickerThumb } from '@data/curations'
import styles from '@style'

export default function SelectedTray({
  selected,
  perToken,
  onRemove,
  onMove,
  onFeeChange,
}) {
  if (!selected.length) {
    return <p className={styles.empty}>No tokens selected yet.</p>
  }

  return (
    <div className={styles.tray}>
      {selected.map((token, i) => {
        const key = tokenKey(token)
        const thumb = pickerThumb(token)
        return (
          <div className={styles.tray_item} key={key}>
            {thumb && <LazyLoadImage src={thumb} alt="" decoding="async" />}
            <span className={styles.tray_name}>{token.name}</span>

            {perToken && (
              <input
                className={`${styles.textarea} ${styles.tray_fee}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="fee ꜩ"
                value={token.feeTez ?? ''}
                onChange={(e) => onFeeChange(key, e.target.value)}
              />
            )}

            <div className={styles.tray_actions}>
              <button
                type="button"
                className={styles.icon_btn}
                disabled={i === 0}
                onClick={() => onMove(i, -1)}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.icon_btn}
                disabled={i === selected.length - 1}
                onClick={() => onMove(i, 1)}
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.icon_btn}
                onClick={() => onRemove(key)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
