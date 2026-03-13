import { useEffect, useState } from 'react'
import { Page } from '@atoms/layout'
import { Button } from '@atoms/button'
import {
  useShadownetStore,
  SHADOWNET_RPC,
  SHADOWNET_TZKT,
} from '@context/shadownetStore'
import styles from '@style'

export default function Testnet() {
  const address = useShadownetStore((st) => st.address)
  const balance = useShadownetStore((st) => st.balance)
  const sync = useShadownetStore((st) => st.sync)
  const unsync = useShadownetStore((st) => st.unsync)
  const setAccount = useShadownetStore((st) => st.setAccount)
  const getBalance = useShadownetStore((st) => st.getBalance)

  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setAccount()
  }, [setAccount])

  useEffect(() => {
    if (address) {
      getBalance()
    }
  }, [address, getBalance])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await sync()
    } catch (e) {
      console.error('Shadownet sync failed:', e)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Page title="Testnet Sandbox">
      <div className={styles.container}>
        <h1 className={styles.headline}>Testnet Sandbox</h1>
        <span className={styles.badge}>Shadownet</span>

        <div className={styles.info}>
          <p>
            This is an isolated testing environment connected to the Tezos
            Shadownet. Contracts deployed here use test tez and do not affect
            mainnet.
          </p>
          <p>
            <strong>RPC:</strong> <code>{SHADOWNET_RPC}</code>
          </p>
          <p>
            <strong>TzKT:</strong> <code>{SHADOWNET_TZKT}</code>
          </p>
          <p>
            <strong>Faucet:</strong>{' '}
            <code>https://faucet.shadownet.teztnets.com/</code>
          </p>
        </div>

        <div className={styles.wallet}>
          {address ? (
            <>
              <div className={styles.walletRow}>
                <div>
                  <strong>Connected</strong>
                  <div className={styles.address}>{address}</div>
                </div>
                <Button onClick={unsync}>Disconnect</Button>
              </div>
              {balance !== undefined && (
                <div className={styles.balanceRow}>
                  Balance: {(balance / 1e6).toFixed(2)} tez
                </div>
              )}
            </>
          ) : (
            <div className={styles.walletRow}>
              <span>No wallet connected to Shadownet</span>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button to="/testnet/channels">Channels</Button>
          <p>
            Use the Shadownet faucet to get test tez, then deploy and interact
            with contracts here.
          </p>
        </div>
      </div>
    </Page>
  )
}
