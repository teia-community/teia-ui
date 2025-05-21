import { useState, useEffect } from 'react'
import Button from '@atoms/button/Button'
import styles from './index.module.scss'
import { fetchProposals, fetchAllVotes } from '@data/swr'
import { useUserStore } from '@context/userStore'
import { useProposalStore } from '@context/proposalStore'

export default function ProposalList() {
  const address = useUserStore((state) => state.address)
  const voteOnProposal = useProposalStore((s) => s.voteOnProposal)
  const executeProposal = useProposalStore((s) => s.executeProposal)

  const [proposals, setProposals] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) return
    Promise.all([fetchProposals(address), fetchAllVotes(address)])
      .then(([proposalsData, votesData]) => {
        setProposals(proposalsData)
        setVotes(votesData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  const getUserVote = (proposalId: number) => {
    const key = `${proposalId},${address}`
    const match = votes.find((v) => `${v.key[0]},${v.key[1]}` === key)
    return match?.value ?? null
  }

  if (!address) return <p className={styles.error}>Connect your wallet to see proposals.</p>
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
          const votes = entry.value.positive_votes
          const minVotes = entry.value.minimum_votes
          const isExecutable = votes >= minVotes && !entry.value.executed

          return (
            <div key={entry.id} className={styles.card}>
              <p><strong>ID:</strong> {proposalId}</p>
              <p><strong>Kind:</strong> {kind}</p>
              <p><strong>Issuer:</strong> {entry.value.issuer}</p>
              <p><strong>Votes:</strong> {entry.value.positive_votes} / {entry.value.minimum_votes}</p>
              <p><strong>Status:</strong> {entry.value.executed ? '✅ Executed' : '⏳ Pending'}</p>
              <p><strong>Your Vote:</strong> {
                userVote === true ? '✅ Yes' :
                userVote === false ? '❌ No' :
                '❓ Not Voted'
              }</p>
              <div className={styles.button_group}>
                <Button shadow_box fit onClick={() => voteOnProposal(proposalId, true)}>Vote Yes</Button>
                <Button shadow_box fit onClick={() => voteOnProposal(proposalId, false)}>Vote No</Button>
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
