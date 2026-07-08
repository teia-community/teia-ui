import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@atoms/button'
import { isTzAddress, walletPreview } from '@utils/string'
import styles from '@style'

/**
 * Ban List
 */
export default function BanListManager({
  banned = [],
  onBan,
  onUnban,
  profiles = {},
}) {
  const [addr, setAddr] = useState('')
  const [busy, setBusy] = useState(null)

  const trimmed = addr.trim()
  const valid = isTzAddress(trimmed)

  const ban = async () => {
    if (!valid) return
    setBusy(trimmed)
    try {
      await onBan(trimmed)
      setAddr('')
    } catch {
      // surfaced via modal
    } finally {
      setBusy(null)
    }
  }

  const unban = async (a) => {
    setBusy(a)
    try {
      await onUnban(a)
    } catch {
      // surfaced via modal
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={styles.ban_box}>
      <h3 className={styles.ban_head}>Ban list ({banned.length})</h3>
      <div className={styles.ban_input_row}>
        <input
          className={styles.input}
          placeholder="tz1… address to ban"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
        />
        <Button
          small
          shadow_box
          disabled={!valid || busy === trimmed}
          onClick={ban}
        >
          Ban
        </Button>
      </div>
      {banned.length === 0 ? (
        <p className={styles.muted}>No banned addresses.</p>
      ) : (
        <ul className={styles.ban_list}>
          {banned.map((a) => (
            <li key={a}>
              <Link to={`/tz/${a}`} className={styles.mono}>
                {profiles[a]?.alias || walletPreview(a)}
              </Link>
              <Button
                small
                shadow_box
                disabled={busy === a}
                onClick={() => unban(a)}
              >
                Unban
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
