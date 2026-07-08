import { useState } from 'react'
import classnames from 'classnames'
import { Button } from '@atoms/button'
import styles from '@style'

/**
 * Contract-level pause switch.
 */
export default function PauseToggle({ label, paused, onToggle }) {
  const [busy, setBusy] = useState(false)

  const handle = async () => {
    setBusy(true)
    try {
      await onToggle(!paused)
    } catch {
      // surfaced via modal
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.pause_box}>
      <div className={styles.pause_info}>
        <div>
          <strong>{label}:</strong>{' '}
          <span
            className={classnames(styles.badge, {
              [styles.badge_paused]: paused,
              [styles.badge_active]: !paused,
            })}
          >
            {paused ? 'Paused' : 'Active'}
          </span>
        </div>
        <p className={styles.muted}>
          {paused
            ? 'All posting is currently blocked contract-wide.'
            : 'Pausing blocks all new posts contract-wide.'}
        </p>
      </div>
      <Button small shadow_box disabled={busy} onClick={handle}>
        {busy ? '…' : paused ? 'Unpause' : 'Pause'}
      </Button>
    </div>
  )
}
