import { useState, useEffect } from 'react'
import Button from '@atoms/button/Button'
import styles from './index.module.scss'
import { fetchProposals, fetchAllVotes, fetchExpirationTime } from '@data/swr'
import { useUserStore } from '@context/userStore'
import { useProposalStore } from '@context/proposalStore'

export default function ProposalList() {
  const address = useUserStore((state) => state.address)
  const voteOnProposal = useProposalStore((s) => s.voteOnProposal)
  const executeProposal = useProposalStore((s) => s.executeProposal)

  const [proposals, setProposals] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expirationTime, setExpirationTime] = useState<number>(0)

  useEffect(() => {
    Promise.all([fetchProposals(), address ? fetchAllVotes(address) : Promise.resolve([])])
      .then(([proposalsData, votesData]) => {
        setProposals(proposalsData)
        setVotes(votesData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  const getUserVote = (proposalId: number) => {
    const match = votes.find(
      (v) => Number(v.key.nat) === Number(proposalId) && v.key.address === address
    )
    return match?.value ?? null
  }
  const getExpirationTime = (timestamp: string, expirationDays: number) => {
    const proposalDate = new Date(timestamp)
    const expirationDate = new Date(proposalDate.getTime() + expirationDays * 86400000)
    const now = new Date()
    const diff = expirationDate.getTime() - now.getTime()

    if (diff <= 0) return '⛔ Expired'

    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    return `${days}d ${hours}h ${minutes}m`
  }
  useEffect(() => {
    fetchExpirationTime()
      .then((days) => setExpirationTime(Number(days)))
      .catch((err) => {
        console.error('Failed to fetch expiration time:', err)
        setExpirationTime(10) // fallback value
      })
  }, [])

  if (loading) return <p>Loading proposals...</p>
  if (!proposals.length) return <p>No proposals found.</p>

  return (
    <div className={styles.form_section}>
      <h2 className={styles.title}>Active Proposals</h2>
      <div className={styles.list}>
        {proposals.map((entry) => {
          const proposalId = entry.key
          const kind = Object.keys(entry.value.kind)[0]
          const userVote = getUserVote(proposalId)
          const positiveVotes  = entry.value.positive_votes
          const minVotes = entry.value.minimum_votes
          const isExecutable = positiveVotes >= minVotes && !entry.value.executed
          const yesVotes = votes.filter(
            (v) => Number(v.key.nat) === Number(proposalId) && v.value === true
          ).length

          const noVotes = votes.filter(
            (v) => Number(v.key.nat) === Number(proposalId) && v.value === false
          ).length

          return (
            <div key={entry.id} className={styles.card}>
              <p><strong>ID:</strong> {proposalId}</p>
              <p><strong>Kind:</strong> {kind}</p>
              <p><strong>Issuer:</strong> {entry.value.issuer}</p>
              <p><strong>Votes:</strong> ✅ {yesVotes} / ❌ {noVotes} (Min: {entry.value.minimum_votes})</p>
              <p><strong>Expires In:</strong> {getExpirationTime(entry.value.timestamp, expirationTime)}</p>
              <p><strong>Status:</strong> {entry.value.executed ? '✅ Executed' : '⏳ Pending'}</p>
              <p><strong>Your Vote:</strong> {
                userVote === true ? '✅ Yes' :
                userVote === false ? '❌ No' :
                '❓ Not Voted'
              }</p>
              <div className={styles.button_group}>
                <Button
                  shadow_box
                  fit
                  disabled={!address}
                  onClick={() => voteOnProposal(proposalId, true)}
                  className={userVote === true ? styles.active : ''}
                >
                  ✅ Vote Yes
                </Button>
                <Button
                  shadow_box
                  fit
                  disabled={!address}
                  onClick={() => voteOnProposal(proposalId, false)}
                  className={userVote === false ? styles.active : ''}
                >
                  ❌ Vote No
                </Button>
              </div>
              {isExecutable && (
                <Button
                  shadow_box
                  fit
                  onClick={() => executeProposal(proposalId)}
                >
                  ✅ Execute Proposal
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
