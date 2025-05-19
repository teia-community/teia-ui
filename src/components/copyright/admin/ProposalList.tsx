import { useState, useEffect } from 'react'
import Button from '@atoms/button/Button'
import styles from './index.module.scss'
import { fetchProposals } from '@data/swr'
import { useUserStore } from '@context/userStore'

export default function ProposalList() {
  const address = useUserStore((state) => state.address)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) return
    fetchProposals(address)
      .then((res) => setProposals(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [address])

  if (!address) return <p className={styles.error}>Connect your wallet to see proposals.</p>
  if (loading) return <p>Loading proposals...</p>
  if (!proposals.length) return <p>No proposals found.</p>

  return (
    <div className={styles.form_section}>
      <h2 className={styles.title}>Active Proposals</h2>
      <div className={styles.list}>
        {proposals.map((entry) => {
          const kind = Object.keys(entry.value.kind)[0]
          return (
            <div key={entry.id} className={styles.card}>
              <p><strong>ID:</strong> {entry.key}</p>
              <p><strong>Kind:</strong> {kind}</p>
              <p><strong>Issuer:</strong> {entry.value.issuer}</p>
              <p><strong>Votes:</strong> {entry.value.positive_votes} / {entry.value.minimum_votes}</p>
              <p><strong>Status:</strong> {entry.value.executed ? '✅ Executed' : '⏳ Pending'}</p>
              <p><strong>Text (hex):</strong></p>
              <code className={styles.code}>{entry.value.text}</code>
              <Button fit shadow_box>
                View Details
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
