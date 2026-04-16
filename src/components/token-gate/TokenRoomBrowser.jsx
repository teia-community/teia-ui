import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import styles from './index.module.scss'

export default function TokenRoomBrowser() {
  const [fa2Address, setFa2Address] = useState('')
  const [tokenId, setTokenId] = useState('')

  return (
    <Page title="Token Chat">
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/messages"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            ←
          </Link>
          <h2 className={styles.headline}>Token Gated Chat</h2>
        </div>
        <p className={styles.subtitle}>Coming soon.</p>

        <div
          className={styles.browserForm}
          style={{ opacity: 0.5, pointerEvents: 'none' }}
        >
          <label className={styles.formLabel}>
            FA2 Contract Address
            <input
              type="text"
              className={styles.formInput}
              value={fa2Address}
              onChange={(e) => setFa2Address(e.target.value)}
              placeholder="KT1..."
              disabled
            />
          </label>
          <label className={styles.formLabel}>
            Token ID
            <input
              type="text"
              className={styles.formInput}
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="0"
              disabled
            />
          </label>
          <Button shadow_box disabled>
            Open Chat
          </Button>
        </div>
      </div>
    </Page>
  )
}
